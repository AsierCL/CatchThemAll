#!/usr/bin/env bash
#
# Levanta el stack de desarrollo de CatchThemAll:
#   1. Postgres (docker compose)
#   2. API Spring Boot (Maven)
#   3. Frontend Vite
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
RUN_DIR="$ROOT_DIR/.run"
BACKEND_LOG="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"

BIND_HOST="${BIND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
export VITE_API_PROXY_TARGET="${VITE_API_PROXY_TARGET:-http://127.0.0.1:${BACKEND_PORT}}"

BACKEND_PID=""
FRONTEND_PID=""
DB_STARTED=0
CLEANED=0

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

  if [[ -n "$BACKEND_PID" || -n "$FRONTEND_PID" ]]; then
    log "Deteniendo API y frontend..."
    stop_group "$BACKEND_PID"
    stop_group "$FRONTEND_PID"

    # Da un margen para el cierre ordenado y después fuerza el grupo completo.
    for _ in {1..10}; do
      if { [[ -z "$BACKEND_PID" ]] || ! kill -0 "$BACKEND_PID" 2>/dev/null; } &&
        { [[ -z "$FRONTEND_PID" ]] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; }; then
        break
      fi
      sleep 0.3
    done

    [[ -n "$BACKEND_PID" ]] && kill -KILL -- "-${BACKEND_PID}" 2>/dev/null || true
    [[ -n "$FRONTEND_PID" ]] && kill -KILL -- "-${FRONTEND_PID}" 2>/dev/null || true
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

for cmd in docker java node npm curl; do
  need "$cmd"
done

docker info >/dev/null 2>&1 || fail "Docker no está corriendo o el usuario no tiene permisos."
[[ -x "$BACKEND_DIR/mvnw" ]] || fail "No encontré $BACKEND_DIR/mvnw."

if port_in_use "$BACKEND_PORT"; then
  fail "El puerto ${BACKEND_PORT} ya está en uso. Cerrá ese proceso o usá BACKEND_PORT=otro."
fi
if port_in_use "$FRONTEND_PORT"; then
  fail "El puerto ${FRONTEND_PORT} ya está en uso. Cerrá ese proceso o usá FRONTEND_PORT=otro."
fi

mkdir -p "$RUN_DIR"
: >"$BACKEND_LOG"
: >"$FRONTEND_LOG"

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
printf '  %sLogs:%s        %s y %s\n' "$BOLD" "$RESET" "$BACKEND_LOG" "$FRONTEND_LOG"
printf '\n  %sCtrl+C detiene API y frontend; Postgres queda corriendo.%s\n' "$DIM" "$RESET"
printf '  %sLa cámara necesita HTTPS o localhost; desde la IP de la LAN usá subida de archivo.%s\n\n' "$DIM" "$RESET"

# Si cualquiera de los dos servicios se cae, cerramos el otro y salimos.
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

log "Uno de los servicios se detuvo; cerrando el resto..."
exit 1
