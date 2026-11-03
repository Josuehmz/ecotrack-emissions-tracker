-- EcoTrack · tabla de mediciones de emisiones (v4, auditada)
-- Ejecutar en el SQL Editor de Supabase o como migración. Es idempotente: se puede correr dos veces.
-- Pruebas: bash herramientas/probar-rls.sh  (PostgreSQL 17 en Docker, rol anon, 9 pruebas)

create table if not exists public.emissions (
  id          uuid primary key default gen_random_uuid(),
  source_name text not null,
  category    text not null,
  co2_kg      numeric(12, 2) not null,
  measured_at timestamptz not null default now(),
  -- Las mismas reglas que valida el formulario (src/utils/validation.ts), repetidas en la BD:
  -- el frontend no es una frontera de seguridad.
  constraint emissions_source_name_len check (char_length(source_name) between 1 and 80 and source_name = btrim(source_name)),
  constraint emissions_category_valid  check (category in ('Transporte', 'Energía', 'Residuos')),
  constraint emissions_co2_range       check (co2_kg >= 0 and co2_kg <= 9999999999.99)
);

create index if not exists emissions_measured_at_idx on public.emissions (measured_at desc);

-- 1. Privilegios: QUÉ operaciones puede hacer cada rol.
-- En Supabase cada tabla nueva de public nace con TODO concedido a anon y authenticated
-- (incluido truncate, que RLS no filtra). Las políticas no quitan esos privilegios: se revocan.
revoke all on table public.emissions from public, anon, authenticated;
grant select on table public.emissions to anon, authenticated;
-- Insert solo de lo que aporta el usuario: id y measured_at los pone la BD y no se pueden falsificar.
grant insert (source_name, category, co2_kg) on table public.emissions to anon, authenticated;
-- Sin update, delete ni truncate: una medición registrada no se edita desde el frontend.

-- 2. Row Level Security: SOBRE QUÉ filas.
alter table public.emissions enable row level security;

drop policy if exists "emissions_select_todos" on public.emissions;
create policy "emissions_select_todos"
  on public.emissions for select
  to anon, authenticated
  using (true);

drop policy if exists "emissions_insert_valida" on public.emissions;
create policy "emissions_insert_valida"
  on public.emissions for insert
  to anon, authenticated
  with check (
    category in ('Transporte', 'Energía', 'Residuos')
    and co2_kg between 0 and 9999999999.99
    and char_length(btrim(source_name)) between 1 and 80
  );

-- En producción: quitar anon de las políticas, exigir sesión (authenticated) y agregar una columna
-- organization_id con políticas del tipo
--   using (organization_id = (select organization_id from public.members where user_id = (select auth.uid())))
-- para que cada empresa vea e inserte solo sus mediciones. Este lab no tiene login, por eso anon lee e inserta.
