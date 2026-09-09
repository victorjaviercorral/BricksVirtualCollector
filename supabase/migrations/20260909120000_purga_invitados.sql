-- Fase 3 del plan de acceso de invitado (ADR-011): purga automática de invitados caducados.
-- Cierra de paso el hallazgo V4a (el job de purga de `system_logs` de 20260810130000 nunca se
-- creó porque `pg_cron` estaba deshabilitado — la política de privacidad promete 30 días de
-- retención de logs y no se cumplía).
--
-- Qué hace:
--   1. Asegura `pg_cron` habilitado.
--   2. `public.purgar_invitados_expirados(ventana)` — borra los invitados sin actividad en la
--      ventana (48 h por defecto) y todo su rastro.
--   3. Programa el job diario `purga-invitados`.
--   4. Reprograma `purge-system-logs` (V4a) — idempotente.
--
-- ---------------------------------------------------------------------------------------------
-- ACCIÓN MANUAL DEL TITULAR, imprescindible antes de aplicar:
--   Supabase → Database → Extensions → activar **pg_cron**. Si el `create extension` de abajo
--   falla por permisos, actívala en el panel y vuelve a ejecutar la migración (o solo las
--   secciones 3 y 4 en el SQL Editor). Mismo patrón que 20260810130000.
-- ---------------------------------------------------------------------------------------------

-- 1. pg_cron -------------------------------------------------------------------------------------
create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 2. Función de purga -------------------------------------------------------------------------
-- security definer: se ejecuta como su propietario (postgres), que es quien puede borrar de
-- auth.users y storage.objects. La ventana es un parámetro para poder probar con un valor corto.
--
-- Qué NO hace falta borrar explícitamente (se va en cascada al borrar el `auth.users`):
--   usuarios_perfil (id → auth.users on delete cascade)
--   vitrinas / sets / fotos (cadena de FK on delete cascade hasta fotos)
--   insignias_usuario, bounties_reclamados, exposicion_sets (usuario_id / set_id cascade)
--   bricks_recibidos de los PROPIOS sets del invitado (set_id → sets on delete cascade)
--
-- Qué SÍ hay que borrar a mano:
--   a) bricks_recibidos que el invitado emitió sobre sets AJENOS (reales): el `set_id` apunta a
--      un set que sobrevive, así que no cascada. Formatos de hash_visitante:
--        - voto normal:        <uid>::text                      (src/app/api/bricks/route.ts:33)
--        - voto de exposición: 'exposicion-<expoId>-user-<uid>'  (ExposicionClient.tsx:99)
--      (los hashes de recompensa de bounty 'bounty-<id>-<i>-<uuid>' van en el set del propio
--       invitado → cascada, no hay que tocarlos.)
--   b) storage.objects: Supabase NO cascada Storage desde auth.users. Las fotos se suben vía
--      service_role (api/sets/foto), así que `owner` puede ser null → se filtra por el prefijo
--      de carpeta del path, que SIEMPRE es '<uid>/...' (api/sets/foto/route.ts:88,
--      perfil/page.tsx). Se borran las filas de storage.objects (dejan de servirse y listarse).
--      NOTA: borrar la fila no elimina el blob físico en el backend de Storage (limitación
--      conocida de Supabase). El volumen es acotado (fotos de invitado con tope en la Fase 6, y
--      la Fase 6 puede además bloquear la subida para invitados, cerrando el hueco). Un GC real
--      del blob (Edge Function programada o pg_net + Storage API) queda como follow-up si el
--      volumen lo justifica.
create or replace function public.purgar_invitados_expirados(ventana interval default interval '48 hours')
returns table (invitados_borrados integer, bricks_ajenos_borrados integer, objetos_storage_borrados integer)
language plpgsql
security definer
set search_path = public, auth, storage, extensions
as $$
declare
    uids uuid[];
    uids_text text[];
    n_bricks integer := 0;
    n_obj integer := 0;
begin
    select coalesce(array_agg(u.id), '{}'::uuid[])
    into uids
    from auth.users u
    where coalesce(u.is_anonymous, false) = true
      and coalesce(u.last_sign_in_at, u.created_at) < now() - ventana;

    if array_length(uids, 1) is null then
        return query select 0, 0, 0;
        return;
    end if;

    uids_text := array(select id::text from unnest(uids) as id);

    -- a) bricks sobre sets ajenos (voto normal: hash = uid; voto de exposición: '...-user-<uid>')
    with borrados as (
        delete from public.bricks_recibidos b
        where b.hash_visitante = any (uids_text)
           or exists (
                select 1 from unnest(uids_text) as gid
                where b.hash_visitante like 'exposicion-%-user-' || gid
           )
        returning 1
    )
    select count(*)::integer into n_bricks from borrados;

    -- b) objetos de Storage del invitado (por prefijo de carpeta = <uid>/)
    with borrados as (
        delete from storage.objects o
        where o.bucket_id in ('fotos_sets', 'avatars')
          and (storage.foldername(o.name))[1] = any (uids_text)
        returning 1
    )
    select count(*)::integer into n_obj from borrados;

    -- c) el usuario → cascada
    delete from auth.users where id = any (uids);

    return query select array_length(uids, 1)::integer, n_bricks, n_obj;
end;
$$;

comment on function public.purgar_invitados_expirados(interval) is
    'Fase 3 ADR-011: borra invitados (is_anonymous) sin actividad en la ventana dada y todo su rastro (bricks sobre sets ajenos, objetos de Storage, y en cascada perfil/vitrinas/sets/fotos/insignias/reclamos).';

-- 3. Job de purga de invitados -------------------------------------------------------------
select cron.unschedule('purga-invitados')
where exists (select 1 from cron.job where jobname = 'purga-invitados');

select cron.schedule(
    'purga-invitados',
    '17 3 * * *', -- todos los días a las 03:17 UTC (desfasado del de logs para no solaparlos)
    $$ select public.purgar_invitados_expirados(); $$
);

-- 4. V4a — (re)programar la purga de system_logs -----------------------------------------------
-- El job de 20260810130000 no llegó a crearse (pg_cron estaba deshabilitado al aplicarla).
-- Se reproduce aquí, idempotente. Ver esa migración para el detalle.
select cron.unschedule('purge-system-logs')
where exists (select 1 from cron.job where jobname = 'purge-system-logs');

select cron.schedule(
    'purge-system-logs',
    '0 3 * * *',
    $$ delete from public.system_logs where created_at < now() - interval '30 days'; $$
);

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   -- 4.1 Los dos jobs existen y están activos
--   select jobname, schedule, active from cron.job order by jobname;
--   -- Esperado: 'purga-invitados' ('17 3 * * *', true) y 'purge-system-logs' ('0 3 * * *', true).
--
--   -- 4.2 Prueba funcional real de la purga (la que cierra la Fase 3):
--   --   1. Entrar como invitado en la app y crear una vitrina + un set + votar un set público.
--   --   2. Envejecer esa sesión a mano:
--   --        update auth.users
--   --        set last_sign_in_at = now() - interval '3 days'
--   --        where is_anonymous = true
--   --          and id = '<uid del invitado de prueba>';
--   --   3. Ejecutar la purga con ventana corta para no tocar otros invitados recientes:
--   --        select * from public.purgar_invitados_expirados(interval '2 days');
--   --      Devuelve (invitados_borrados, bricks_ajenos_borrados, objetos_storage_borrados).
--   --   4. Comprobar que desaparece todo lo suyo y NADA de una cuenta real:
--   --        select count(*) from auth.users where id = '<uid>';                 -- 0
--   --        select count(*) from public.usuarios_perfil where id = '<uid>';     -- 0
--   --        select count(*) from public.vitrinas where usuario_id = '<uid>';    -- 0
--   --        select count(*) from public.bricks_recibidos where hash_visitante = '<uid>'; -- 0
--   --        -- una cuenta real cualquiera sigue intacta.
--
--   -- 4.3 Historial de ejecuciones del cron (tras la primera pasada nocturna):
--   --   select jobid, status, start_time, return_message from cron.job_run_details
--   --   order by start_time desc limit 10;
--
-- Rollback:
--   select cron.unschedule('purga-invitados');
--   drop function if exists public.purgar_invitados_expirados(interval);
--   -- (dejar 'purge-system-logs' — es el comportamiento correcto que V4a pedía)
-- ---------------------------------------------------------------------------------------------
