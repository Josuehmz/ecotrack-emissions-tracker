#!/usr/bin/env bash
# Verificación final del código integrado en src/. Escribe docs/evidencia/verificacion-final.txt.
#   bash herramientas/verificacion-final.sh
set -u
cd "$(dirname "$0")/.."
SALIDA="docs/evidencia/verificacion-final.txt"
mkdir -p docs/evidencia

paso() {
  echo "### \$ $*"
  "$@" 2>&1 | sed -E 's/\x1b\[[0-9;]*m//g'
  echo "(código de salida: ${PIPESTATUS[0]})"
  echo
}

{
  echo "Verificación final de src/ · $(date '+%Y-%m-%d %H:%M:%S %z') · node $(node -v) · pnpm $(pnpm -v) · commit $(git rev-parse --short HEAD)"
  echo
  paso pnpm install --frozen-lockfile
  echo "Nota: tsconfig.json tiene \"files\": [] y solo referencias, así que \`pnpm tsc --noEmit\` no revisa ningún"
  echo "archivo y sale con 0 aunque haya errores. El chequeo real es \`tsc -b\` (script typecheck)."
  echo
  paso pnpm tsc --noEmit
  paso pnpm typecheck
  paso pnpm lint
  paso pnpm test
  paso pnpm build
  echo "### Build con variables de prueba (valores falsos, no son credenciales): tamaño real del bundle"
  VITE_SUPABASE_URL=https://ejemplo-no-real.supabase.co VITE_SUPABASE_ANON_KEY=clave-de-prueba-no-real paso pnpm exec vite build
  echo "### RLS de supabase/schema.sql (PostgreSQL 17 en Docker, rol anon)"
  paso bash herramientas/probar-rls.sh
} > "$SALIDA"
cat "$SALIDA"
