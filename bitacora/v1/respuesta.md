# Dashboard de Emisiones en Tiempo Real · Paso 1: arquitectura

Este paso deja lista la estructura, los tipos y una UI que funciona con datos locales. Supabase todavía no entra. Todo encaja con la configuración real del proyecto: `strict`, `verbatimModuleSyntax` (los tipos se importan siempre con `import type`), `erasableSyntaxOnly` (por eso no hay `enum`), `allowImportingTsExtensions` (los imports llevan `.ts`/`.tsx`, igual que en `main.tsx`) y Tailwind 4 a través de `@tailwindcss/vite`, sin archivo de configuración.

---

## 1. Árbol de `src/` propuesto

```
src/
├── main.tsx                      (ya existe, sin cambios) Monta <App /> en #root dentro de StrictMode.
├── index.css                     (ya existe, sin cambios) Solo @import "tailwindcss".
├── vite-env.d.ts                 Tipos de import.meta.env: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
├── App.tsx                       Layout de la página: encabezado y <EmissionsTracker />. No maneja datos.
│
├── types/
│   └── emissions.ts              Tipos de dominio (Emission, NewEmission, EmissionCategory, la fila de la BD
│                                 y el contrato UseEmissionsResult). No importa nada; es lo único que comparten las capas.
│
├── lib/
│   └── supabaseClient.ts         (paso 2) createClient() con las variables de entorno. Es el ÚNICO archivo
│                                 que llama a createClient. Solo lo importa services/.
│
├── services/
│   └── emissionsService.ts       (paso 2) Acceso a datos: fetchEmissions() e insertEmission(). Traduce
│                                 EmissionRow (snake_case) ⇄ Emission (camelCase) y convierte el error de
│                                 Supabase en un mensaje legible. Devuelve tipos de dominio, nunca tipos de Supabase.
│
├── hooks/
│   └── useEmissions.ts           (paso 2) Estado de la pantalla: carga, inserción, errores y recarga.
│                                 Llama a services/ y devuelve UseEmissionsResult. Puerta única de la UI a los datos.
│
└── components/
    ├── EmissionsTracker.tsx      Contenedor: arma el resumen, el formulario y el grid. En el paso 2 su useState
    │                             se reemplaza por useEmissions().
    ├── EmissionCard.tsx          (se extrae en el paso 2) Tarjeta de presentación: fuente, categoría y CO₂. Sin estado.
    ├── EmissionForm.tsx          (se extrae en el paso 2) Formulario controlado con validación por campo; avisa
    │                             con onAdd(NewEmission).
    └── EmissionsStatus.tsx       (paso 2) Estados de carga, error con "Reintentar" y lista vacía.
```

### Regla de dependencias

```
components/  ──►  hooks/  ──►  services/  ──►  lib/supabaseClient.ts  ──►  @supabase/supabase-js
     │              │              │
     └──────────────┴──────────────┴──►  types/  (todas las capas la pueden importar; ella no importa ninguna)
```

- **`components/` nunca importa `@supabase/supabase-js`, `lib/` ni `services/`.** Solo importa `hooks/` y `types/`.
- El hook tampoco importa el cliente: llama a funciones de `services/`. Así se puede probar con Vitest simulando el servicio, sin red.
- `EmissionRow` está en `types/` para que el contrato con la tabla quede escrito en un solo lugar, pero solo `services/` lo usa.
- La regla se puede hacer cumplir más adelante con `no-restricted-imports` en `.oxlintrc.json`, limitando `@supabase/*` a `src/lib/` y `src/services/`.

---

## Decisiones de diseño

| Decisión | Motivo |
|---|---|
| `EMISSION_CATEGORIES` como tupla `as const`, con el tipo derivado de ella | `erasableSyntaxOnly` prohíbe `enum`. Además, una sola fuente alimenta el tipo y el `<select>`. |
| `isEmissionCategory()` como guarda de tipo | El `<select>` y la BD entregan `string`. Se valida en tiempo de ejecución en vez de usar `as`. |
| `co2Kg` en kilogramos y la unidad en el nombre del campo | Evita confundir kg con toneladas. La UI pasa a toneladas solo al mostrar el valor (≥ 1000 kg). |
| `NewEmission` con `Pick` de `Emission` | El `id` y `measuredAt` los asigna el sistema; el usuario no los envía. |
| `EmissionFormValues` con `co2Kg: string` | Un input numérico es texto mientras se escribe (`""`, `"12,"`). Se convierte solo al validar y se acepta coma decimal. |
| `validateForm` como función pura que devuelve una unión discriminada `{ ok }` | Se puede probar sin React, y el compilador obliga a revisar `ok` antes de usar `value`. |
| `readonly` en `Emission` y `readonly Emission[]` | El estado no se modifica en el lugar; se crea un arreglo nuevo (`[created, ...prev]`). |
| `UseEmissionsResult` ya está declarado | La UI del paso 2 se escribe contra ese contrato, aunque el hook todavía no exista. |
| Card y formulario dentro de `EmissionsTracker.tsx` por ahora | El paso pide una primera versión de ese archivo. Ya son subcomponentes con props tipadas, así que extraerlos solo implica moverlos. |
| Accesibilidad básica | `label`/`htmlFor` con `useId`, `aria-invalid` y `aria-describedby` en los errores, `<time dateTime>` y una lista semántica `<ul>`. |

Grid responsive: 1 columna en móvil, 2 desde `sm` y 3 desde `lg`. El formulario usa el mismo criterio: apilado en móvil, 2 columnas en `sm` y una sola fila en `lg`.

---

## Archivos entregados

- `src/types/emissions.ts`: tipos de dominio completos.
- `src/components/EmissionsTracker.tsx`: primera versión con `useState` y datos de ejemplo, grid de cards y formulario.
- `src/App.tsx`: muestra `<EmissionsTracker />`.

`main.tsx`, `index.css` y `vite-env.d.ts` no cambian en este paso.

---

## 5. Estados de la interfaz que `useEmissions` debe exponer en el paso 2

Ya están tipados en `UseEmissionsResult` (`src/types/emissions.ts`):

| Estado / acción | Tipo | Qué hace la UI con él |
|---|---|---|
| `emissions` | `readonly Emission[]` | Pinta el grid. Las más recientes van primero. |
| `status` | `'idle' \| 'loading' \| 'success' \| 'error'` | `idle`/`loading`: muestra un esqueleto o spinner. `error`: muestra un mensaje y el botón "Reintentar". `success` con lista vacía: muestra el estado vacío. |
| `loadError` | `string \| null` | Mensaje legible si falló la carga del listado. |
| `isSubmitting` | `boolean` | Deshabilita el botón "Agregar" y cambia su texto a "Guardando…". Evita inserciones dobles. |
| `submitError` | `string \| null` | Error de la última inserción, mostrado junto al formulario sin borrar lo que escribió el usuario. |
| `addEmission(input)` | `(NewEmission) => Promise<boolean>` | Inserta. Si devuelve `true`, el formulario se limpia; si devuelve `false`, conserva los valores. |
| `reload()` | `() => Promise<void>` | Lo usa el botón "Reintentar" tras un error de carga. |
| `clearSubmitError()` | `() => void` | Se llama cuando el usuario vuelve a editar el formulario. |

Estados derivados (no hace falta guardarlos, se calculan): **lista vacía** (`status === 'success' && emissions.length === 0`) y **total de CO₂** (`reduce` sobre `emissions`).

Se separan a propósito el error de **carga** y el de **inserción**: si falla una inserción, el listado que ya está en pantalla sigue visible.

Para el paso 2 quedan abiertas dos decisiones:

1. **Inserción optimista o pesimista.** Propongo pesimista al principio: se espera la fila que devuelve `insert().select().single()`, así el `id` y `measuredAt` vienen de la BD.
2. **"Tiempo real".** Una suscripción con `supabase.channel(...).on('postgres_changes', …)` dentro del hook, cancelada en el cleanup del `useEffect`. Agregaría el estado `isLive: boolean` para mostrar un indicador de conexión.
