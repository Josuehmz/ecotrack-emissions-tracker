# Dashboard de Emisiones · Paso 3: refinamiento

Esta respuesta corrige los fallos que salieron al verificar la v2 y aplica las cuatro restricciones del prompt.

## Qué cambió y por qué

| # | Cambio | Archivo | Por qué |
|---|---|---|---|
| A1 | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride` | `tsconfig.app.json` | Pedido explícito. Con eso `emissions[0]` pasa a ser `Emission \| undefined` y `{ campo: undefined }` deja de compilar. |
| A2 | `parseEmissionRow` estrecha con `isRecord()` y `typeof`, sin `as` | `services/emissionsService.ts` | Ya no queda `row as Record<string, unknown>`. Además rechaza `co2_kg` negativo y el string vacío. |
| A3 | `isEmissionCategory(value: unknown)` con `.some()` | `types/emissions.ts` | Se quita el `as readonly string[]`. |
| A4 | `EmissionFormErrors` como tipo mapeado opcional y `withoutError()` | `types/`, `utils/validation.ts` | Borrar un error ahora quita la clave en vez de escribir `undefined`. |
| A5 | `summarizeEmissions` usa un literal con las tres categorías | `utils/format.ts` | Sin `Object.fromEntries(...) as Record<…>`: si se agrega una categoría, el compilador avisa. |
| B1 | `const [repo] = useState(() => repository)` | `hooks/useEmissions.ts` | **Causa de las 2 pruebas en timeout de v2.** El hook se queda con el repositorio del primer render, así que uno nuevo en cada render ya no dispara recargas. Hay prueba de regresión. |
| B2 | `status` empieza en `'loading'` y la carga se separa en `fetchList` (sin `setStatus` síncrono) y `reload` | `hooks/useEmissions.ts` | Aviso `set-state-in-effect`. |
| B3 | Formatos a `utils/format.ts` | `components/EmissionCard.tsx` | Aviso `only-export-components`. |
| B4 | `parseDecimal()` acepta `1.234,5`, `1234.5` y `1234,5`; rechaza `1,2,3`, `abc`, `Infinity`, `1e5` y el vacío | `utils/validation.ts` | v1 y v2 cambiaban solo la primera coma. 21 casos de prueba. |
| B5 | `submittingRef` bloquea el doble envío | `hooks/useEmissions.ts` | `isSubmitting` llega un render tarde; un ref se actualiza al instante. Hay prueba con una promesa diferida. |
| C1 | Esqueleto con `role="status"` y `aria-live`; errores con `role="alert"` | `components/EmissionsStatus.tsx`, `EmissionForm.tsx` | Lectores de pantalla. |
| C2 | El foco va al primer campo con error al enviar | `components/EmissionForm.tsx` | WCAG 3.3.1. |
| C3 | Se pinta el error de categoría | `components/EmissionForm.tsx` | Se calculaba y no se mostraba. |
| C4 | Texto `sr-only` «1,24 toneladas de CO2 equivalente» | `utils/format.ts`, cards y resumen | «CO₂e» no se lee bien en voz alta. |
| C5 | Badges `-800/-900` sobre `-100`, botón `emerald-700` y `focus-visible` en todos los controles | componentes | Contraste AA y foco visible. |
| D1 | `useMemo` para el resumen (total y desglose) | `components/EmissionsTracker.tsx` | Antes se recalculaba en cada tecla. |
| D2 | `memo` en `EmissionCard` y `EmissionsSummary` | componentes | Escribir en el formulario ya no re-renderiza las cards. |
| D3 | El hook devuelve un objeto con `useMemo` y funciones con `useCallback` | `hooks/useEmissions.ts` | Hay prueba que comprueba que `result.current` es el mismo objeto tras un `rerender`. |

## Archivos nuevos

- `utils/format.ts` y `utils/validation.ts`, con su prueba `validation.test.ts`.
- `components/EmissionsStatus.tsx`: carga, error de carga y estado vacío.
- `components/EmissionsSummary.tsx`: total y desglose por categoría.

## Pruebas

`hooks/useEmissions.test.ts` pasa a 7 casos. Los nuevos son la regresión del repositorio inestable, `reload` tras un error, `clearSubmitError`, el doble envío y la estabilidad del objeto que devuelve el hook. `utils/validation.test.ts` tiene 20 casos.
