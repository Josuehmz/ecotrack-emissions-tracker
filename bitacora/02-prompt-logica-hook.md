# Prompt 2 · Lógica del hook useEmissions

Objetivo del paso: sacar los datos de la UI. Se le entrega a la IA el contrato que ella misma
propuso en el paso 1 (`UseEmissionsResult`) y lo que se observó al revisar v1, y se le pide el hook
con carga, inserción y errores contra Supabase, más un modo demo cuando no hay credenciales.

## Qué se observó en v1 antes de escribir este prompt

- `tsc`, `oxlint` y `vite build` pasan sin errores ni avisos ([`v1/verificacion.txt`](v1/verificacion.txt)).
- Los datos viven en `useState` dentro del componente: no hay carga, ni errores, ni persistencia.
- El total se recalcula con `reduce` en cada render, incluso al escribir en el formulario.
- La validación usa `replace(',', '.')`, que solo cambia la primera coma, así que `1.234,5` termina
  en `NaN` y sale como «Debe ser un número».
- El error de categoría se calcula pero nunca se pinta.
- La card y el formulario siguen dentro de `EmissionsTracker.tsx`.

## Prompt enviado (literal)

```text
Seguimos con el Dashboard de Emisiones de EcoTrack. Te paso el contrato que propusiste en el
paso anterior (src/types/emissions.ts, interfaz UseEmissionsResult) y el componente v1, que
compila con tsc estricto, oxlint y vite build sin errores.

Ahora quiero la lógica de datos, separada de la UI:

1. src/lib/supabaseClient.ts: crea el cliente SOLO si existen VITE_SUPABASE_URL y
   VITE_SUPABASE_ANON_KEY. Si falta alguna, exporta null en vez de lanzar un error: la app tiene
   que arrancar igual en "modo demo". Ninguna clave escrita en el código.
2. src/services/emissionsService.ts: fetchEmissions() e insertEmission() contra la tabla
   public.emissions (id uuid, source_name text, category text, co2_kg numeric, measured_at
   timestamptz). Mapea snake_case a camelCase en un solo lugar y valida cada fila que llega:
   si la categoría no es una de las tres, descarta la fila en vez de hacer un cast con "as".
   Ojo: numeric de Postgres puede llegar como string por PostgREST.
3. Un repositorio en memoria para el modo demo, con la misma interfaz que el servicio real, un
   retardo artificial para que se vea el loader y datos marcados claramente como simulados.
4. src/hooks/useEmissions.ts que implemente UseEmissionsResult:
   - status 'loading' al montar, 'success' o 'error' al terminar;
   - addEmission pesimista (espera la fila que devuelve la BD) y devuelve true/false;
   - errores de carga y de inserción separados; un fallo al insertar no borra la lista;
   - si el componente se desmonta mientras llega la respuesta, que no haga setState
     (StrictMode monta dos veces en desarrollo);
   - exponer también "mode": 'supabase' | 'demo' para que la UI lo muestre.
   El hook recibe el repositorio por parámetro (con el real o el demo por defecto) para poder
   probarlo con Vitest sin red.
5. Reescribe EmissionsTracker.tsx para usar solo el hook: loader mientras carga, mensaje de
   error con botón "Reintentar", estado vacío, botón "Guardando…" deshabilitado durante la
   inserción y un aviso visible de "modo demo". La UI no importa nada de lib/ ni de services/.
6. supabase/schema.sql con la tabla, un check de categoría y de co2_kg >= 0, y RLS.
7. Pruebas de Vitest para el hook con un repositorio falso: carga correcta, carga con error,
   inserción correcta e inserción con error.

Archivos completos. No toques todavía la accesibilidad ni el rendimiento: eso va en el
siguiente paso.
```

## Respuesta

La respuesta, tal cual, está en [`v2/respuesta.md`](v2/respuesta.md) y el código en
[`v2/src/`](v2/src/) y [`v2/supabase/schema.sql`](v2/supabase/schema.sql). La verificación está en
[`v2/verificacion.txt`](v2/verificacion.txt) y la comparación con v1 en
[`v2/cambios-desde-v1.diff`](v2/cambios-desde-v1.diff).
