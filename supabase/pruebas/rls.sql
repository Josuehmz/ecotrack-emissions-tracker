-- Pruebas de privilegios y RLS de public.emissions, ejecutadas con el rol anon
-- (el mismo que usa el frontend con la anon key). Cada prueba imprime OK o FALLA.
\set ON_ERROR_STOP off
set role anon;

do $$ begin
  perform count(*) from public.emissions;
  raise notice 'OK    1. anon puede leer las mediciones';
exception when others then raise notice 'FALLA 1. anon no puede leer: %', sqlerrm; end $$;

do $$ begin
  insert into public.emissions (source_name, category, co2_kg) values ('Prueba válida', 'Energía', 10.5);
  raise notice 'OK    2. anon inserta una medición válida';
exception when others then raise notice 'FALLA 2. anon no pudo insertar una medición válida: %', sqlerrm; end $$;

do $$ begin
  insert into public.emissions (source_name, category, co2_kg) values ('Categoría inválida', 'Agua', 1);
  raise notice 'FALLA 3. se aceptó la categoría «Agua»';
exception when check_violation then raise notice 'OK    3. categoría fuera de la lista rechazada (check)'; end $$;

do $$ begin
  insert into public.emissions (source_name, category, co2_kg) values ('Negativo', 'Residuos', -1);
  raise notice 'FALLA 4. se aceptó co2_kg negativo';
exception when check_violation then raise notice 'OK    4. co2_kg negativo rechazado (check)'; end $$;

do $$ begin
  insert into public.emissions (source_name, category, co2_kg, measured_at) values ('Fecha falsa', 'Energía', 1, '1999-01-01');
  raise notice 'FALLA 5. el cliente pudo fijar measured_at (1999-01-01)';
exception when insufficient_privilege then raise notice 'OK    5. el cliente no puede fijar measured_at'; end $$;

do $$ begin
  insert into public.emissions (id, source_name, category, co2_kg) values ('00000000-0000-0000-0000-000000000001', 'Id elegido', 'Energía', 1);
  raise notice 'FALLA 6. el cliente pudo elegir el id';
exception when insufficient_privilege then raise notice 'OK    6. el cliente no puede elegir el id'; end $$;

do $$ begin
  update public.emissions set co2_kg = 0;
  raise notice 'FALLA 7. update permitido (filas afectadas sin error; RLS solo lo vuelve silencioso)';
exception when insufficient_privilege then raise notice 'OK    7. update denegado'; end $$;

do $$ begin
  delete from public.emissions;
  raise notice 'FALLA 8. delete permitido (sin error)';
exception when insufficient_privilege then raise notice 'OK    8. delete denegado'; end $$;

do $$ begin
  execute 'truncate public.emissions';
  raise notice 'FALLA 9. truncate permitido: RLS no aplica a truncate y borró la tabla';
exception when insufficient_privilege then raise notice 'OK    9. truncate denegado'; end $$;

reset role;
select 'filas al terminar: ' || count(*) from public.emissions;
