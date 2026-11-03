# Prompt 3 · Refinamiento: TypeScript estricto, accesibilidad y re-renders

Objetivo del paso: endurecer el código de v2 con restricciones explícitas y corregir lo que falló al
verificarlo. Este prompt no parte de una idea general: parte de la salida real de las herramientas.

## Qué se observó en v2 antes de escribir este prompt

Fuente: [`v2/verificacion.txt`](v2/verificacion.txt).

- `tsc` y `vite build` pasan.
- **Vitest: 2 de 4 pruebas fallan por timeout** (las dos de inserción). Causa: la prueba hace
  `renderHook(() => useEmissions(fakeRepository()))`, así que en cada render llega un repositorio
  nuevo. `reload` depende de `repository`, el efecto se vuelve a disparar y la carga nunca termina.
  El fallo no está en la prueba: muestra que el hook se rompe si quien lo llama no memoriza el
  argumento.
- **oxlint, 2 avisos:**
  - `react(set-state-in-effect)` en `useEmissions.ts:57`: el efecto llama a `reload()`, que hace
    `setStatus('loading')` de forma síncrona.
  - `react(only-export-components)` en `EmissionCard.tsx:13`: el archivo exporta `formatCo2` junto al
    componente.
- Arrastrado de v1: `replace(',', '.')` solo cambia la primera coma, el total se recalcula en cada
  tecla y el error de categoría no se pinta.
- Accesibilidad: el «Cargando…» y los errores no se anuncian a los lectores de pantalla, y tras un
  envío fallido el foco se queda en el botón.
- Bundle con variables de prueba: 444,55 kB (126,97 kB gzip). Sin variables, 228,41 kB, porque Vite
  elimina Supabase como código muerto.

## Prompt enviado (literal)

```text
Refina la v2 del Dashboard de Emisiones. Te paso la salida real de tsc, oxlint y vitest.
Restricciones nuevas, todas obligatorias:

A. TypeScript estricto de verdad
   - Activa en tsconfig.app.json "noUncheckedIndexedAccess", "exactOptionalPropertyTypes" y
     "noImplicitOverride", y deja el código sin errores.
   - Ningún "as" salvo "as const". parseEmissionRow tiene que estrechar el tipo con
     comprobaciones, no con "row as Record<string, unknown>".
   - EmissionFormErrors no puede aceptar undefined explícito (con exactOptionalPropertyTypes,
     { campo: undefined } no es lo mismo que omitir el campo).

B. Bugs encontrados en la verificación
   - 2 pruebas fallan por timeout: el hook recarga sin fin cuando el repositorio no es estable
     entre renders. El hook debe ser robusto a eso sin pedirle nada a quien lo llama.
   - Quita el aviso set-state-in-effect: el estado inicial ya debe ser 'loading' y el efecto
     no debe hacer setState síncrono.
   - Quita el aviso only-export-components: las funciones de formato van a src/utils/.
   - La validación del formulario va a src/utils/validation.ts como función pura, con pruebas.
     Debe aceptar "1.234,5" (formato colombiano), "1234.5" y "1234,5"; rechazar "1,2,3", "abc",
     "-3", "Infinity" y el vacío.
   - Evita doble envío: si addEmission se llama mientras otra inserción está en curso, devuelve
     false sin llamar al repositorio. Agrega la prueba.

C. Accesibilidad (WCAG 2.1 AA)
   - Loader con role="status" y aria-live="polite"; errores de carga y de envío con role="alert".
   - aria-busy en la lista mientras carga.
   - Tras un envío fallido por validación, el foco va al primer campo con error.
   - El error de categoría se pinta como los demás.
   - El total y el conteo de fuentes se anuncian de forma comprensible (CO₂e no se lee bien).
   - Contraste suficiente en los badges y foco visible en todos los controles.

D. Re-renders
   - useMemo para el total y el desglose por categoría; el desglose se muestra como resumen.
   - React.memo en EmissionCard para que escribir en el formulario no re-renderice las cards.
   - El objeto que devuelve el hook memorizado con useMemo, y las funciones con useCallback.

Devuelve archivos completos y una tabla de qué cambió y por qué.
```

## Respuesta

La respuesta, tal cual, está en [`v3/respuesta.md`](v3/respuesta.md) y el código en
[`v3/src/`](v3/src/). La verificación está en [`v3/verificacion.txt`](v3/verificacion.txt) y la
comparación con v2 en [`v3/cambios-desde-v2.diff`](v3/cambios-desde-v2.diff).
