-- Stub mínimo de lo que un proyecto de Supabase ya trae ANTES de cualquier migración.
-- Solo sirve para probar schema.sql en un PostgreSQL 17 normal (Docker, postgres:17-alpine).
-- En un proyecto real de Supabase todo esto ya existe: NO se ejecuta allá.
create role anon          nologin noinherit;
create role authenticated nologin noinherit;
create role service_role  nologin noinherit bypassrls;
grant usage on schema public to anon, authenticated, service_role;

-- Como en Supabase: cada tabla nueva de public nace con TODO concedido a los roles de la API.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
