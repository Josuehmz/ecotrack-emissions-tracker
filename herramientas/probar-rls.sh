#!/usr/bin/env bash
# Prueba un schema.sql de Supabase en un PostgreSQL 17 desechable (Docker) con el rol anon.
#   bash herramientas/probar-rls.sh                     # supabase/schema.sql
#   bash herramientas/probar-rls.sh bitacora/v2/supabase/schema.sql
# Orden: stub de Supabase -> schema -> una fila semilla -> supabase/pruebas/rls.sql
set -euo pipefail
cd "$(dirname "$0")/.."
SCHEMA="${1:-supabase/schema.sql}"
NOMBRE="ecotrack-rls-$$"

docker run -d --rm --name "$NOMBRE" -e POSTGRES_PASSWORD=postgres postgres:17-alpine >/dev/null
trap 'docker rm -f "$NOMBRE" >/dev/null 2>&1 || true' EXIT
for _ in $(seq 1 60); do
  docker exec "$NOMBRE" psql -U postgres -h 127.0.0.1 -tAc 'select 1' >/dev/null 2>&1 && break
  sleep 1
done
psql_c() { docker exec -i "$NOMBRE" psql -U postgres -h 127.0.0.1 -q "$@"; }

echo "== $(date '+%Y-%m-%d %H:%M:%S %z') · $(psql_c -tAc 'select version()')"
echo "== Schema: $SCHEMA"
psql_c -v ON_ERROR_STOP=1 < supabase/pruebas/stub-supabase.sql
psql_c -v ON_ERROR_STOP=1 < "$SCHEMA"
psql_c -c "insert into public.emissions (source_name, category, co2_kg) values ('Semilla', 'Transporte', 100)"
psql_c < supabase/pruebas/rls.sql 2>&1 | sed -E 's/^psql:<stdin>:[0-9]+: //; s/^NOTICE:  //'
