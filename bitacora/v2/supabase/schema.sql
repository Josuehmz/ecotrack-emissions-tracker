-- EcoTrack · tabla de mediciones de emisiones (v2)
-- Ejecutar en el SQL Editor de Supabase o como migración.

create table if not exists public.emissions (
  id          uuid primary key default gen_random_uuid(),
  source_name text not null check (char_length(source_name) between 1 and 80),
  category    text not null check (category in ('Transporte', 'Energía', 'Residuos')),
  co2_kg      numeric(12, 2) not null check (co2_kg >= 0),
  measured_at timestamptz not null default now()
);

create index if not exists emissions_measured_at_idx on public.emissions (measured_at desc);

-- Row Level Security
alter table public.emissions enable row level security;

create policy "Lectura pública de mediciones"
  on public.emissions for select
  to anon, authenticated
  using (true);

create policy "Inserción de mediciones"
  on public.emissions for insert
  to anon, authenticated
  with check (true);
