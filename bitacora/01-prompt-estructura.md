# Prompt 1 · Estructura

Objetivo del paso: que la IA proponga la arquitectura de componentes a partir de la especificación,
antes de escribir lógica. Se le da el stack exacto y la regla de dependencias, y se le pide solo
estructura, tipos y una primera maqueta con datos locales.

## Prompt enviado (literal)

```text
Actúa como arquitecto frontend senior. Vamos a construir el núcleo de la interfaz del
"Dashboard de Emisiones en Tiempo Real" de EcoTrack, una startup que mide la huella de
carbono de empresas. El equipo de backend ya tiene la tabla de mediciones en Supabase.

Stack fijo (ya instalado, no propongas otro):
- Vite 8 + React 19 + TypeScript 6 con "strict": true y "verbatimModuleSyntax": true
- Tailwind CSS 4 con el plugin @tailwindcss/vite (no hay tailwind.config.js; index.css solo
  tiene @import "tailwindcss")
- @supabase/supabase-js 2

Especificación funcional:
- Componente EmissionsTracker con un listado de tarjetas (cards). Cada card muestra el
  nombre de la fuente, la categoría (Transporte, Energía o Residuos) y el CO2 producido.
- Un formulario para agregar nuevas mediciones.
- Un custom hook useEmissions que, más adelante, gestionará la carga, la inserción y los
  errores contra Supabase.

En ESTE paso solo quiero la arquitectura, no la lógica de datos:
1. Propón el árbol de archivos de src/ y la responsabilidad de cada archivo. Regla: la UI
   (components/) nunca importa Supabase; solo habla con el hook.
2. Escribe los tipos de dominio en src/types/emissions.ts.
3. Escribe una primera versión de src/components/EmissionsTracker.tsx con datos de ejemplo
   en estado local (useState), sin Supabase todavía: grid de cards responsive y el
   formulario, maquetados con Tailwind.
4. Actualiza src/App.tsx para mostrar el componente.
5. Lista los estados de la interfaz que el hook tendrá que exponer en el siguiente paso.

Entrega archivos completos, no fragmentos.
```

## Respuesta

La respuesta de la IA, tal cual, está en [`v1/respuesta.md`](v1/respuesta.md) y el código que
devolvió, sin editar, en [`v1/src/`](v1/src/). La verificación de ese código está en
[`v1/verificacion.txt`](v1/verificacion.txt).
