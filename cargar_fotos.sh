
#!/usr/bin/env bash

DIRECTORIO="./fotos de prueba"
API="http://localhost:8080/captures/create"

if [[ ! -d "$DIRECTORIO" ]]; then
    echo "Error: no existe el directorio '$DIRECTORIO'"
    exit 1
fi

total=0
correctas=0
errores=0

while IFS= read -r -d '' imagen; do
    archivo=$(basename "$imagen")

    # Extraer nombre y versión: braddpitt_1.jpg -> braddpitt
    if [[ "$archivo" =~ ^(.+)_([0-9]+)\.(jpg|jpeg|png|webp)$ ]]; then
        nombre="${BASH_REMATCH[1]}"
    else
        echo "[SKIP] Nombre no válido: $archivo"
        continue
    fi

    echo "Procesando: $archivo (nombre=$nombre)"

    respuesta=$(curl -sS \
        -w $'\n%{http_code}' \
        -X POST "$API" \
        -F "image=@${imagen}" \
        -F "data={\"name\":\"${nombre}\"};type=application/json")

    codigo=$(printf '%s\n' "$respuesta" | tail -n 1)
    cuerpo=$(printf '%s\n' "$respuesta" | sed '$d')

    total=$((total + 1))

    if [[ "$codigo" == "201" ]]; then
        echo "[OK] $archivo"
        correctas=$((correctas + 1))
    else
        echo "[ERROR] $archivo (HTTP $codigo)"
        echo "$cuerpo"
        errores=$((errores + 1))
    fi

done < <(find "$DIRECTORIO" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' \
       -o -iname '*.png' -o -iname '*.webp' \) \
    -print0)

echo
echo "========== RESUMEN =========="
echo "Total: $total"
echo "Correctas: $correctas"
echo "Errores: $errores"

