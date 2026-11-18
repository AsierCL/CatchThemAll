#!/usr/bin/env bash
#
# Levanta el stack de desarrollo de CatchThemAll:
#   1. Postgres (docker compose)
#   2. Microservicio Python de reconocimiento facial (gRPC)
#   3. API Spring Boot (Maven)
#   4. Carga de embeddings de private/famosos si hace falta
#   5. Frontend Vite
#
# API y frontend escuchan en 0.0.0.0 para poder abrirlos desde el teléfono u
# otra máquina de la red local.
#
# Uso:
#   ./run.sh
#
# Variables opcionales:
#   BIND_HOST=0.0.0.0
#   BACKEND_PORT=8080
#   FRONTEND_PORT=5173
#   VITE_API_PROXY_TARGET=http://127.0.0.1:8080
#
# Ctrl+C detiene API y frontend. Postgres queda corriendo para conservar datos.

set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/CatchThemAll"
FRONTEND_DIR="$ROOT_DIR/Frontend"
FACIAL_DIR="$ROOT_DIR/FacialRecognition"
FACIAL_VENV="$FACIAL_DIR/.venv"
FAMOUS_DIR="$ROOT_DIR/private/famosos"
RUN_DIR="$ROOT_DIR/.run"
BACKEND_LOG="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"
FACIAL_LOG="$RUN_DIR/facial.log"

BIND_HOST="${BIND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
FACIAL_PORT="${FACIAL_PORT:-9090}"
export VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-http://127.0.0.1:${BACKEND_PORT}}"

BACKEND_PID=""
FRONTEND_PID=""
FACIAL_PID=""
DB_STARTED=0
CLEANED=0
FACIAL_STARTED=0

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'
  RED=$'\033[31m'
  DIM=$'\033[2m'
  RESET=$'\033[0m'
else
  BOLD=""
  RED=""
  DIM=""
  RESET=""
fi

log() { printf '%s[run]%s %s\n' "${BOLD}${RED}" "$RESET" "$*"; }
note() { printf '%s[run]%s %s\n' "$DIM" "$RESET" "$*"; }
fail() {
  printf '\n%s[run] Error:%s %s\n' "${BOLD}${RED}" "$RESET" "$*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "Falta '$1'. Instalalo y volvé a intentarlo."
}

compose() {
  (cd "$BACKEND_DIR" && docker compose -f docker-compose.yaml "$@")
}

port_in_use() {
  local port="$1"
  (exec 3<>"/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1
}

stop_group() {
  local pid="$1"
  [[ -z "$pid" ]] && return 0

  if kill -0 -- "-${pid}" 2>/dev/null; then
    kill -TERM -- "-${pid}" 2>/dev/null || true
  elif kill -0 "$pid" 2>/dev/null; then
    kill -TERM "$pid" 2>/dev/null || true
  fi
}

cleanup() {
  local status=$?
  [[ "$CLEANED" -eq 1 ]] && return
  CLEANED=1
  trap - EXIT INT TERM HUP

  if [[ -n "$BACKEND_PID" || -n "$FRONTEND_PID" || -n "$FACIAL_PID" ]]; then
    log "Deteniendo API, frontend y reconocimiento facial..."
    stop_group "$BACKEND_PID"
    stop_group "$FRONTEND_PID"
    stop_group "$FACIAL_PID"

    # Da un margen para el cierre ordenado y después fuerza el grupo completo.
    for _ in {1..10}; do
      if { [[ -z "$BACKEND_PID" ]] || ! kill -0 "$BACKEND_PID" 2>/dev/null; } &&
        { [[ -z "$FRONTEND_PID" ]] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; } &&
        { [[ -z "$FACIAL_PID" ]] || ! kill -0 "$FACIAL_PID" 2>/dev/null; }; then
        break
      fi
      sleep 0.3
    done

    [[ -n "$BACKEND_PID" ]] && kill -KILL -- "-${BACKEND_PID}" 2>/dev/null || true
    [[ -n "$FRONTEND_PID" ]] && kill -KILL -- "-${FRONTEND_PID}" 2>/dev/null || true
    [[ -n "$FACIAL_PID" ]] && kill -KILL -- "-${FACIAL_PID}" 2>/dev/null || true
    wait 2>/dev/null || true
  fi

  if [[ "$DB_STARTED" -eq 1 ]]; then
    note "Postgres sigue corriendo. Para apagarlo: (cd CatchThemAll && docker compose down)"
  fi
  exit "$status"
}
trap cleanup EXIT INT TERM HUP

wait_for_http() {
  local name="$1"
  local url="$2"
  local pid="$3"
  local max_seconds="$4"
  local log_file="$5"

  for ((i = 0; i < max_seconds; i++)); do
    if ! kill -0 "$pid" 2>/dev/null; then
      printf '\n--- últimas líneas de %s ---\n' "$log_file" >&2
      tail -n 80 "$log_file" >&2 || true
      fail "$name terminó antes de estar listo."
    fi
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  printf '\n--- últimas líneas de %s ---\n' "$log_file" >&2
  tail -n 80 "$log_file" >&2 || true
  fail "$name no respondió en ${max_seconds}s."
}

wait_for_tcp() {
  local name="$1"
  local port="$2"
  local pid="$3"
  local max_seconds="$4"
  local log_file="$5"

  for ((i = 0; i < max_seconds; i++)); do
    if ! kill -0 "$pid" 2>/dev/null; then
      printf '\n--- últimas líneas de %s ---\n' "$log_file" >&2
      tail -n 80 "$log_file" >&2 || true
      fail "$name terminó antes de estar listo."
    fi
    if port_in_use "$port"; then
      return 0
    fi
    sleep 1
  done

  printf '\n--- últimas líneas de %s ---\n' "$log_file" >&2
  tail -n 80 "$log_file" >&2 || true
  fail "$name no escuchó en el puerto ${port} en ${max_seconds}s."
}

detect_lan_ip() {
  if command -v ip >/dev/null 2>&1; then
    ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit }}'
    return
  fi
  if command -v hostname >/dev/null 2>&1 && hostname -I >/dev/null 2>&1; then
    hostname -I 2>/dev/null | awk '{print $1; exit}'
    return
  fi
  if command -v ipconfig >/dev/null 2>&1; then
    ipconfig getifaddr en0 2>/dev/null || true
  fi
}

psql_db() {
  compose exec -T postgres psql -U usuario -d catchthemall -v ON_ERROR_STOP=1 "$@"
}

ensure_facial_venv() {
  if [[ ! -x "$FACIAL_VENV/bin/python" ]]; then
    log "Creando entorno Python del reconocimiento facial..."
    python3 -m venv "$FACIAL_VENV" || fail "No se pudo crear el venv en ${FACIAL_VENV}."
  fi

  local requirements_hash marker
  requirements_hash="$(sha256sum "$FACIAL_DIR/requirements.txt" | awk '{print $1}')"
  marker="$FACIAL_VENV/.requirements.sha256"

  if [[ ! -f "$marker" || "$(cat "$marker")" != "$requirements_hash" ]]; then
    log "Instalando dependencias del reconocimiento facial (la primera vez puede tardar)..."
    if ! "$FACIAL_VENV/bin/python" -m pip install --disable-pip-version-check \
      -r "$FACIAL_DIR/requirements.txt" >"$RUN_DIR/facial-install.log" 2>&1; then
      tail -n 80 "$RUN_DIR/facial-install.log" >&2 || true
      fail "No se pudieron instalar las dependencias del reconocimiento facial."
    fi
    printf '%s\n' "$requirements_hash" >"$marker"
  fi
}

start_facial_service() {
  if port_in_use "$FACIAL_PORT"; then
    note "El reconocimiento facial ya está escuchando en localhost:${FACIAL_PORT}; se reutiliza."
    FACIAL_STARTED=0
    return
  fi

  ensure_facial_venv
  log "Arrancando reconocimiento facial en localhost:${FACIAL_PORT}..."
  set -m
  (
    cd "$FACIAL_DIR"
    export PYTHONPATH="$FACIAL_DIR/src"
    exec "$FACIAL_VENV/bin/python" -m capture_service.server
  ) >"$FACIAL_LOG" 2>&1 &
  FACIAL_PID=$!
  set +m
  FACIAL_STARTED=1
}

embedding_count() {
  local name="$1"
  psql_db -v name="$name" -tA <<'SQL' 2>/dev/null | tr -d '[:space:]'
SELECT count(*) FROM face_embeddings WHERE name = :'name';
SQL
}

delete_embeddings() {
  local name="$1"
  psql_db -v name="$name" >/dev/null <<'SQL'
DELETE FROM face_embeddings WHERE name = :'name';
SQL
}

ensure_famous() {
  local name="$1"
  local category="$2"
  local type="$3"

  psql_db \
    -v name="$name" \
    -v category="$category" \
    -v type="$type" >/dev/null <<'SQL'
INSERT INTO famous (famous_id, pokedex_number, name, category, type)
SELECT gen_random_uuid(),
       COALESCE((SELECT MAX(pokedex_number) FROM famous), 0) + 1,
       :'name',
       :'category',
       :'type'
WHERE NOT EXISTS (SELECT 1 FROM famous WHERE name = :'name');

UPDATE famous
SET category = :'category',
    type = :'type'
WHERE name = :'name';
SQL
}

load_famous_photos() {
  local dir="$1"
  local name category type
  name="$(basename "$dir")"
  category="Common"
  type="Meme"

  if [[ -f "$dir/.meta" ]]; then
    category="$(sed -n 's/^category=//p' "$dir/.meta" | head -n 1)"
    type="$(sed -n 's/^type=//p' "$dir/.meta" | head -n 1)"
    category="${category:-Common}"
    type="${type:-Meme}"
  fi

  local -a photos
  mapfile -t photos < <(
    find "$dir" -maxdepth 1 -type f \
      \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
      -print | sort
  )

  # El famoso existe en el catalogo aunque todavia no tenga fotos.
  ensure_famous "$name" "$category" "$type"

  if ((${#photos[@]} == 0)); then
    note "Sin fotos en private/famosos/${name}; se omite la carga de embeddings."
    return
  fi

  local hash marker count
  hash="$(for photo in "${photos[@]}"; do sha256sum "$photo"; done | sha256sum | awk '{print $1}')"
  marker="$dir/.embeddings.sha256"
  count="$(embedding_count "$name" || true)"

  if [[ -f "$marker" && "$(cat "$marker")" == "$hash" && "${count:-0}" -gt 0 ]]; then
    note "Embeddings de ${name} al día (${count})."
    return
  fi

  log "Cargando ${#photos[@]} foto(s) de ${name}..."
  delete_embeddings "$name"

  local photo
  for photo in "${photos[@]}"; do
    if ! curl -fsS --max-time 60 -X POST "http://127.0.0.1:${BACKEND_PORT}/captures/create" \
      -F "image=@${photo}" --form-string "data=${name}" >/dev/null; then
      fail "No se pudo cargar $(basename "$photo") para ${name}. Revisá ${FACIAL_LOG} y ${BACKEND_LOG}."
    fi
    note "  ✓ $(basename "$photo")"
  done

  count="$(embedding_count "$name" || true)"
  printf '%s\n' "$hash" >"$marker"
  note "Embeddings de ${name}: ${count:-0}."
}

seed_famous_embeddings() {
  mkdir -p "$FAMOUS_DIR"

  if [[ -z "$(psql_db -tAc "SELECT to_regclass('public.face_embeddings');" 2>/dev/null | tr -d '[:space:]')" ]]; then
    fail "El servicio facial no creó la tabla face_embeddings. Revisá ${FACIAL_LOG}."
  fi

  local found=0 dir
  while IFS= read -r -d '' dir; do
    found=1
    load_famous_photos "$dir"
  done < <(find "$FAMOUS_DIR" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)

  if [[ "$found" -eq 0 ]]; then
    note "No hay carpetas en private/famosos; no se cargaron embeddings."
  fi
}

for cmd in docker java node npm curl python3; do
  need "$cmd"
done

docker info >/dev/null 2>&1 || fail "Docker no está corriendo o el usuario no tiene permisos."
[[ -x "$BACKEND_DIR/mvnw" ]] || fail "No encontré $BACKEND_DIR/mvnw."
[[ -d "$FACIAL_DIR" ]] || fail "No encontré $FACIAL_DIR."

if port_in_use "$BACKEND_PORT"; then
  fail "El puerto ${BACKEND_PORT} ya está en uso. Cerrá ese proceso o usá BACKEND_PORT=otro."
fi
if port_in_use "$FRONTEND_PORT"; then
  fail "El puerto ${FRONTEND_PORT} ya está en uso. Cerrá ese proceso o usá FRONTEND_PORT=otro."
fi

mkdir -p "$RUN_DIR"
: >"$BACKEND_LOG"
: >"$FRONTEND_LOG"
: >"$FACIAL_LOG"
: >"$RUN_DIR/facial-install.log"

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "Instalando dependencias del frontend (primera vez)..."
  (cd "$FRONTEND_DIR" && npm install)
fi

log "Levantando Postgres..."
compose up -d postgres
DB_STARTED=1

log "Esperando a que Postgres acepte conexiones..."
DB_READY=0
for _ in {1..60}; do
  if compose exec -T postgres pg_isready -U usuario -d catchthemall >/dev/null 2>&1; then
    DB_READY=1
    break
  fi
  sleep 1
done

if [[ "$DB_READY" -ne 1 ]]; then
  compose logs --tail=60 postgres || true
  fail "Postgres no respondió a tiempo."
fi
note "Postgres listo en localhost:7777."

start_facial_service

log "Arrancando API en ${BIND_HOST}:${BACKEND_PORT}..."
# Job control: cada servicio queda en su propio grupo de procesos para poder
# detener también los procesos hijos (Java de Spring Boot, Vite bajo npm).
set -m
(
  cd "$BACKEND_DIR"
  export SPRING_DOCKER_COMPOSE_ENABLED=false
  exec ./mvnw -ntp spring-boot:run \
    -Dspring-boot.run.arguments="--server.address=${BIND_HOST} --server.port=${BACKEND_PORT}"
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

log "Arrancando frontend en ${BIND_HOST}:${FRONTEND_PORT}..."
(
  cd "$FRONTEND_DIR"
  exec npm run dev -- --host "$BIND_HOST" --port "$FRONTEND_PORT" --strictPort
) >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
set +m

log "Esperando a la API (puede tardar en el primer arranque)..."
wait_for_http "La API" "http://127.0.0.1:${BACKEND_PORT}/v3/api-docs" "$BACKEND_PID" 180 "$BACKEND_LOG"

if [[ -n "$FACIAL_PID" ]]; then
  log "Esperando al reconocimiento facial..."
  wait_for_tcp "El reconocimiento facial" "$FACIAL_PORT" "$FACIAL_PID" 300 "$FACIAL_LOG"
fi

log "Cargando fotos de famosos desde private/famosos..."
seed_famous_embeddings

log "Esperando al frontend..."
wait_for_http "El frontend" "http://127.0.0.1:${FRONTEND_PORT}/" "$FRONTEND_PID" 45 "$FRONTEND_LOG"

LAN_IP="$(detect_lan_ip || true)"
LOCAL_URL="http://localhost:${FRONTEND_PORT}"
LOCAL_API="http://localhost:${BACKEND_PORT}"

printf '\n%s%s listo.%s\n\n' "$BOLD" "CatchThemAll" "$RESET"
printf '  %sWeb local:%s   %s\n' "$BOLD" "$RESET" "$LOCAL_URL"
if [[ -n "$LAN_IP" && ( "$BIND_HOST" == "0.0.0.0" || "$BIND_HOST" == "::" ) ]]; then
  printf '  %sWeb LAN:%s     http://%s:%s\n' "$BOLD" "$RESET" "$LAN_IP" "$FRONTEND_PORT"
fi
printf '  %sAPI:%s         %s\n' "$BOLD" "$RESET" "$LOCAL_API"
printf '  %sSwagger:%s     %s/swagger-ui.html\n' "$BOLD" "$RESET" "$LOCAL_API"
printf '  %sLogs:%s        %s, %s y %s\n' "$BOLD" "$RESET" "$BACKEND_LOG" "$FRONTEND_LOG" "$FACIAL_LOG"
printf '  %sFotos:%s       %s/<Nombre>/ (ignorada por git)\n' "$BOLD" "$RESET" "$FAMOUS_DIR"
printf '\n  %sCtrl+C detiene API, frontend y reconocimiento; Postgres queda corriendo.%s\n' "$DIM" "$RESET"
printf '  %sLa cámara necesita HTTPS o localhost; desde la IP de la LAN usá subida de archivo.%s\n\n' "$DIM" "$RESET"

# Si cualquiera de los servicios se cae, cerramos el resto y salimos.
while kill -0 "$BACKEND_PID" 2>/dev/null &&
  kill -0 "$FRONTEND_PID" 2>/dev/null &&
  { [[ -z "$FACIAL_PID" ]] || kill -0 "$FACIAL_PID" 2>/dev/null; }; do
  sleep 1
done

log "Uno de los servicios se detuvo; cerrando el resto..."
exit 1
