# Dashboard de Emisiones · Paso 4: auditoría

## 1. Análisis de código: lint en cero

| Hallazgo en v3 | Corrección | Archivo |
|---|---|---|
| `exhaustive-deps`: se leía `lastRequestRef.current` en el cleanup | La carga pasa a ser una suscripción con una bandera local `active`; ya no hay contador en un ref | `hooks/useEmissions.ts` |
| `set-state-in-effect` | El efecto solo lanza `repo.list()` y el estado se aplica en el `.then`. «Reintentar» cambia `loadRequest`, que vuelve a disparar el efecto | `hooks/useEmissions.ts` |
| `prefer-tag-over-role` | `<output aria-live="polite">`, que ya tiene `role="status"` implícito | `components/EmissionsStatus.tsx` |

Cambio de contrato: `reload` devuelve `void`. El resultado llega por `status`, no por una promesa.
La prueba de reintento ahora espera `loading` y después `success`.

La arquitectura la hace cumplir `.oxlintrc.json` con `no-restricted-imports`:

- `src/components/**` no puede importar `@supabase/supabase-js`, `lib/` ni `services/`.
- `src/hooks/**` no puede importar `@supabase/supabase-js` ni `lib/`.

Para comprobarlo se escribieron archivos temporales con imports prohibidos, y la regla dio los
4 errores esperados ([`lint-regla-arquitectura.txt`](lint-regla-arquitectura.txt)).

## 2. Verificación RLS

`supabase/schema.sql` ahora:

1. `revoke all` a `public`, `anon` y `authenticated`. Después `grant select` y `grant insert
   (source_name, category, co2_kg)`, solo sobre esas columnas.
2. Políticas `emissions_select_todos` y `emissions_insert_valida`, con un `with check` que repite
   las reglas del formulario.
3. `drop policy if exists`, para que el script sea idempotente.
4. Un comentario sobre lo que cambiaría en producción: sesión obligatoria y `organization_id` por fila.

Resultado: **9 de 9** pruebas pasan, frente a 4 de 9 en v2 ([`rls-pruebas.txt`](rls-pruebas.txt)).
El script se aplicó dos veces sin error. En v2, la segunda ejecución fallaba porque la política ya existía.

## 3. Estados verificables (modo demo)

`?simular=lento | error-carga | error-guardado | vacio` lo lee `services/index.ts`, y solo cuando
no hay credenciales. El aviso de modo demo dice qué simulación está activa. En `error-carga`, «Reintentar»
funciona en el segundo intento. Hay 10 pruebas nuevas en `services/demoRepository.test.ts`.

## 4. Tamaño de bundle

Ver la sección de auditoría de la bitácora. La diferencia entre compilar con y sin variables de
entorno es `@supabase/supabase-js`. Sin credenciales, Vite lo elimina como código muerto, así que el
número real para el usuario es el de la compilación con variables.
