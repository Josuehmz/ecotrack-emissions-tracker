# Dashboard de Emisiones · Paso 2: lógica de datos con useEmissions

En este paso los datos salen de la UI. Queda una capa por responsabilidad y la UI no conoce Supabase.

## 1. Capas

```
components/EmissionsTracker.tsx  ──►  hooks/useEmissions.ts  ──►  services/index.ts (defaultRepository)
                                                                   ├─ services/emissionsService.ts ──► lib/supabaseClient.ts
                                                                   └─ services/demoRepository.ts  (MODO DEMO, en memoria)
```

- `lib/supabaseClient.ts` crea el cliente solo si están `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  Si falta alguna exporta `null`, la app no se rompe y entra en modo demo.
- `services/emissionsService.ts` es el único archivo que conoce las columnas. `parseEmissionRow()`
  valida cada fila en tiempo de ejecución y descarta la que trae una categoría desconocida, en vez de
  hacer un `as Emission`. `co2_kg` acepta number o string, porque PostgREST serializa `numeric` como string.
- `toUserMessage()` traduce los códigos de Postgres a mensajes legibles: `42501` (RLS), `23514` (check)
  y los fallos de red.
- `services/demoRepository.ts` tiene la misma interfaz `EmissionsRepository`, un retardo de 700 ms y
  datos con id `demo-*`. No guarda nada.

## 2. El hook

`useEmissions(repository = defaultRepository)` implementa el contrato `UseEmissionsResult` del paso 1,
con el campo nuevo `mode`.

| Requisito | Cómo se cumple |
|---|---|
| `loading` al montar | `useEffect` llama a `reload()`, que pone `status = 'loading'` |
| Inserción pesimista | `await repository.insert()` y la fila devuelta se pone de primera |
| Errores separados | `loadError` y `submitError`; un fallo al insertar no toca `emissions` |
| Sin setState tras desmontar | `mountedRef`, que se vuelve a poner en `true` en el segundo montaje de StrictMode |
| Carreras de recarga | `lastRequestRef`: solo la última petición escribe el estado |
| Probar sin red | El repositorio entra por parámetro |

## 3. UI

`EmissionCard` y `EmissionForm` pasan a archivos propios. `EmissionsTracker` muestra el aviso de modo
demo, «Cargando mediciones…», el error con «Reintentar», el estado vacío y el botón «Guardando…».
El formulario solo se limpia si `addEmission` devuelve `true`.

## 4. SQL

`supabase/schema.sql` tiene la tabla con checks de longitud, categoría y `co2_kg >= 0`, un índice por
fecha, RLS habilitado y las políticas de `select` e `insert` para `anon` y `authenticated`.

## 5. Pruebas

`hooks/useEmissions.test.ts` tiene cuatro casos con un repositorio falso: carga correcta, carga con
error, inserción correcta e inserción con error.
