# Prompt 4 · Auditoría: lint en cero, RLS endurecido y estados verificables

Objetivo del paso: cerrar los cuatro ejes de la Auditoría IA del módulo (Análisis de Código,
Optimización de Prompts, Tamaño de Bundle y Verificación RLS). Se parte de lo que mostraron las
herramientas sobre v3 y de una prueba de RLS que se corrió sobre el `schema.sql` de v2.

## Qué se observó antes de escribir este prompt

- v3: `tsc` sin errores y **27 de 27 pruebas verdes** ([`v3/verificacion.txt`](v3/verificacion.txt)).
- **oxlint sobre v3: 1 error y 2 avisos.**
  - `react-hooks(exhaustive-deps)` (error) en `useEmissions.ts:59`: en el cleanup del efecto se lee
    `lastRequestRef.current`.
  - `react(set-state-in-effect)` (aviso), otra vez en `useEmissions.ts:56`. Separar `fetchList` de
    `reload` no bastó: el linter sigue viendo que el efecto llama a una función que hace setState.
  - `jsx-a11y(prefer-tag-over-role)` (aviso): prefiere `<output>` a `role="status"`.
- **RLS sobre el schema de v2, ejecutado como `anon` en PostgreSQL 17 (Docker): 5 de 9 pruebas
  fallan** ([`v2/rls-pruebas.txt`](v2/rls-pruebas.txt)).
  - El cliente puede fijar `measured_at` (1999-01-01) y elegir el `id`.
  - `update` y `delete` no dan error: RLS sin política los vuelve silenciosos, pero el privilegio existe.
  - `truncate` vació la tabla, porque RLS no aplica a `truncate` y Supabase concede todos los
    privilegios a `anon` en cada tabla nueva de `public`.
- Bundle con variables de prueba: 448,34 kB (127,97 kB gzip). Sin variables, 232,18 kB, porque sin
  credenciales Vite elimina `@supabase/supabase-js`.
- Para las capturas hay que poder mostrar los estados de carga lenta, error de carga, error al
  guardar y lista vacía sin tocar el código.

## Prompt enviado (literal)

```text
Último paso del Dashboard de Emisiones: auditoría. Te paso la salida de oxlint sobre v3 y el
resultado de las pruebas de RLS ejecutadas como rol anon en PostgreSQL 17 contra el schema.sql
de v2. Corrige con estas reglas:

1. Lint en cero (errores y avisos):
   - No leas ref.current en el cleanup del efecto.
   - Ningún setState alcanzable de forma síncrona desde el efecto de carga. Escribe la carga
     inicial como una suscripción: el efecto lanza la promesa, guarda una bandera local
     "activo" y solo aplica el resultado en el .then si sigue activo.
   - Usa <output> en lugar de role="status".
   - Haz cumplir la arquitectura en .oxlintrc.json con no-restricted-imports: components/ no
     puede importar @supabase/*, lib/ ni services/; hooks/ no puede importar lib/ (usa services/).
2. RLS (supabase/schema.sql, idempotente):
   - revoke all a anon y authenticated; grant select, y grant insert SOLO sobre las columnas
     source_name, category y co2_kg. Sin update, delete ni truncate.
   - Políticas con nombre claro: select para anon y authenticated; insert con with check que
     repita las reglas del formulario (categoría, co2_kg entre 0 y el máximo de numeric(12,2),
     nombre de 1 a 80 caracteres sin espacios sobrantes).
   - Comenta qué cambiaría en producción (autenticación y organización por fila).
   Debe pasar las 9 pruebas de supabase/pruebas/rls.sql.
3. Estados verificables en modo demo: con el parámetro de URL ?simular=lento | error-carga |
   error-guardado | vacio el repositorio demo reproduce ese caso. El aviso de modo demo dice qué
   simulación está activa. Nunca afecta al modo Supabase.
4. Mantén las 27 pruebas verdes y agrega las del repositorio demo con simulación.
```

## Respuesta

La respuesta, tal cual, está en [`v4/respuesta.md`](v4/respuesta.md), el código en [`v4/src/`](v4/src/),
el SQL en [`v4/supabase/schema.sql`](v4/supabase/schema.sql) y la configuración del linter en
[`v4/.oxlintrc.json`](v4/.oxlintrc.json). Las verificaciones están en
[`v4/verificacion.txt`](v4/verificacion.txt) y [`v4/rls-pruebas.txt`](v4/rls-pruebas.txt), y la
comparación con v3 en [`v4/cambios-desde-v3.diff`](v4/cambios-desde-v3.diff).
