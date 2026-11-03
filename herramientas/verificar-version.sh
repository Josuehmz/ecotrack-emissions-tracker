#!/usr/bin/env bash
# Verifica una versión de la bitácora: copia bitacora/vN/src sobre src/ y corre tsc, lint, pruebas y build.
#   bash herramientas/verificar-version.sh v1
# La salida completa queda en bitacora/vN/verificacion.txt (es la evidencia que cita la bitácora).
set -u
cd "$(dirname "$0")/.."
VERSION="${1:?uso: verificar-version.sh vN}"
ORIGEN="bitacora/$VERSION/src"
SALIDA="bitacora/$VERSION/verificacion.txt"
[ -d "$ORIGEN" ] || { echo "No existe $ORIGEN"; exit 1; }

rm -rf src && cp -r "$ORIGEN" src
# Los archivos de arranque que la versión no trae se toman del proyecto base (commit inicial).
for base in main.tsx index.css vite-env.d.ts; do
  [ -f "src/$base" ] || git show "$(git rev-list --max-parents=0 HEAD):src/$base" > "src/$base"
done

paso() {
  local titulo="$1"; shift
  echo "### $titulo"
  echo "\$ $*"
  "$@" 2>&1 | sed -E 's/\x1b\[[0-9;]*m//g'
  echo "(código de salida: ${PIPESTATUS[0]})"
  echo
}

{
  echo "Verificación de $VERSION · $(date '+%Y-%m-%d %H:%M:%S %z') · node $(node -v) · pnpm $(pnpm -v)"
  echo
  paso "TypeScript" pnpm exec tsc -b --noEmit
  paso "Lint (oxlint)" pnpm exec oxlint
  if ls src/**/*.test.* src/*.test.* >/dev/null 2>&1 || find src -name '*.test.*' | grep -q .; then
    paso "Pruebas (Vitest)" pnpm exec vitest run
  else
    echo "### Pruebas (Vitest)"; echo "Esta versión no trae pruebas."; echo
  fi
  paso "Build sin variables de entorno" pnpm exec vite build
  VITE_SUPABASE_URL=https://ejemplo-no-real.supabase.co VITE_SUPABASE_ANON_KEY=clave-de-prueba-no-real \
    paso "Build con variables de prueba (valores falsos)" pnpm exec vite build
} > "$SALIDA"
cat "$SALIDA"
