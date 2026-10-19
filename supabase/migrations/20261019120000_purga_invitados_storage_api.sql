-- Incidente CI-2026-004: la purga nocturna de invitados falla desde el 12/09/2026.
--
-- Causa raíz: `public.purgar_invitados_expirados` (20260909120000) hacía `delete from storage.objects`.
-- Supabase protege esa tabla con el trigger `protect_objects_delete` (BEFORE DELETE ... FOR EACH
-- STATEMENT → storage.protect_delete()), que lanza
--   ERROR 42501: Direct deletion from storage tables is not allowed. Use the Storage API instead.
-- Como es un trigger POR SENTENCIA, salta aunque el DELETE no afecte a ninguna fila: el job
-- `purga-invitados` falla todas las noches aunque no haya ficheros que borrar, y como toda la función
-- corre en una transacción, tampoco se borran los invitados caducados ni sus votos.
--
-- Arreglo (enfoque aprobado por Víctor: SQL solo para filas, ficheros con la Storage API):
--   1. Cola `public.storage_borrados_pendientes` (bucket + ruta) que nadie salvo service_role ve.
--   2. `purgar_invitados_expirados` deja de tocar storage.objects con DELETE: ENCOLA las rutas de los
--      ficheros del invitado (SELECT, permitido) y borra solo filas (bricks ajenos + auth.users).
--   3. Edge Function `purgar-ficheros-invitados` (supabase/functions/) que lee la cola y borra con
--      `supabase.storage.from(bucket).remove(paths)` usando service_role. Borrar por la Storage API
--      elimina la fila Y el blob físico, cosa que el DELETE directo tampoco hacía.
--   4. Job `borrar-ficheros-invitados` (pg_cron + pg_net) que invoca la Edge Function 10 min después
--      de la purga, solo si hay rutas en cola.
--
-- Sin secretos en el código:
--   - El token que autentica la llamada cron → Edge Function se GENERA aquí, aleatorio, y se guarda en
--     Vault (`purga_ficheros_token`). La Edge Function lo valida con una RPC (solo service_role), así que
--     no hay que copiarlo a ningún sitio.
--   - La URL de la Edge Function (no es secreta, pero depende del proyecto) se guarda en Vault a mano
--     tras aplicar: ver "Pasos tras aplicar" al final.
--
-- Aplicable desde cero (probada en bvc-e2e, 19/10/2026) e idempotente.

-- 0. pg_net (para que pg_cron pueda llamar a la Edge Function) ----------------------------------
create extension if not exists pg_net with schema extensions;

-- 1. Cola de ficheros pendientes de borrar ------------------------------------------------------
create table if not exists public.storage_borrados_pendientes (
    id bigint generated always as identity primary key,
    bucket_id text not null,
    ruta text not null,
    origen text not null default 'purga_invitados',
    creado_at timestamptz not null default now(),
    ultimo_intento_at timestamptz,
    ultimo_error text,
    unique (bucket_id, ruta)
);

comment on table public.storage_borrados_pendientes is
    'CI-2026-004: rutas de Storage que hay que borrar con la Storage API (no se puede DELETE en storage.objects). La llena purgar_invitados_expirados y la vacía la Edge Function purgar-ficheros-invitados.';

-- RLS activo y sin políticas: solo service_role (bypass RLS) y postgres la leen/escriben.
alter table public.storage_borrados_pendientes enable row level security;
revoke all on table public.storage_borrados_pendientes from public, anon, authenticated;
grant select, insert, update, delete on table public.storage_borrados_pendientes to service_role;

-- 2. Purga: solo filas + encolar rutas ----------------------------------------------------------
-- Cambia la tercera columna devuelta (objetos_storage_borrados → ficheros_encolados), así que hay que
-- borrarla y crearla de nuevo (create or replace no permite cambiar las columnas OUT). El job
-- `purga-invitados` la llama por nombre (`select public.purgar_invitados_expirados();`) y sigue igual.
drop function if exists public.purgar_invitados_expirados(interval);

create function public.purgar_invitados_expirados(ventana interval default interval '48 hours')
returns table (invitados_borrados integer, bricks_ajenos_borrados integer, ficheros_encolados integer)
language plpgsql
security definer
set search_path = public, auth, storage, extensions
as $$
declare
    uids uuid[];
    uids_text text[];
    n_bricks integer := 0;
    n_fich integer := 0;
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

    -- b) ficheros del invitado (prefijo de carpeta = <uid>/): solo se LEEN de storage.objects y se
    --    encolan; los borra la Edge Function purgar-ficheros-invitados con la Storage API.
    --    storage.objects no tiene FK a auth.users, así que borrar el usuario no los arrastra.
    with encolados as (
        insert into public.storage_borrados_pendientes (bucket_id, ruta, origen)
        select o.bucket_id, o.name, 'purga_invitados'
        from storage.objects o
        where o.bucket_id in ('fotos_sets', 'avatars')
          and (storage.foldername(o.name))[1] = any (uids_text)
        on conflict (bucket_id, ruta) do nothing
        returning 1
    )
    select count(*)::integer into n_fich from encolados;

    -- c) el usuario → cascada (perfil, vitrinas, sets, fotos, insignias, reclamos)
    delete from auth.users where id = any (uids);

    return query select array_length(uids, 1)::integer, n_bricks, n_fich;
end;
$$;

comment on function public.purgar_invitados_expirados(interval) is
    'Fase 3 ADR-011 / CI-2026-004: borra invitados (is_anonymous) sin actividad en la ventana y sus filas (bricks sobre sets ajenos; en cascada perfil/vitrinas/sets/fotos/insignias/reclamos). Los ficheros de Storage NO los borra: los encola en storage_borrados_pendientes para la Edge Function purgar-ficheros-invitados.';

-- Mismo cierre que 20261008120000: el drop/create devuelve EXECUTE a PUBLIC (y default privileges a
-- anon/authenticated). Solo postgres (propietario, el cron) y service_role.
revoke execute on function public.purgar_invitados_expirados(interval) from public, anon, authenticated;
grant execute on function public.purgar_invitados_expirados(interval) to service_role;

-- 3. Token de la llamada cron → Edge Function (aleatorio, solo en Vault) -------------------------
do $$
begin
    if not exists (select 1 from vault.secrets where name = 'purga_ficheros_token') then
        perform vault.create_secret(
            replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
            'purga_ficheros_token',
            'CI-2026-004: autentica la llamada de pg_cron a la Edge Function purgar-ficheros-invitados'
        );
    end if;
end $$;

-- La Edge Function (service_role) valida el token recibido contra Vault sin llegar a leerlo.
create or replace function public.validar_token_purga_ficheros(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(
        p_token is not null
        and length(p_token) >= 32
        and exists (
            select 1 from vault.decrypted_secrets s
            where s.name = 'purga_ficheros_token' and s.decrypted_secret = p_token
        ),
        false
    );
$$;

revoke execute on function public.validar_token_purga_ficheros(text) from public, anon, authenticated;
grant execute on function public.validar_token_purga_ficheros(text) to service_role;

-- 4. Lanzador: invoca la Edge Function si hay ficheros en cola ----------------------------------
-- Devuelve el id de la petición de pg_net (respuesta en net._http_response) o null si no hay nada
-- que borrar. Si falta la URL en Vault con ficheros en cola, falla a propósito para que se vea en
-- cron.job_run_details.
create or replace function public.lanzar_borrado_ficheros_pendientes()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_url text;
    v_token text;
begin
    if not exists (select 1 from public.storage_borrados_pendientes) then
        return null;
    end if;

    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'purga_ficheros_url';
    select decrypted_secret into v_token from vault.decrypted_secrets where name = 'purga_ficheros_token';

    if v_url is null or v_token is null then
        raise exception 'Hay ficheros en storage_borrados_pendientes pero falta en Vault purga_ficheros_url o purga_ficheros_token (ver 20261019120000_purga_invitados_storage_api.sql)'
            using errcode = '55000';
    end if;

    return net.http_post(
        url := v_url,
        body := '{}'::jsonb,
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-purga-token', v_token),
        timeout_milliseconds := 60000
    );
end;
$$;

revoke execute on function public.lanzar_borrado_ficheros_pendientes() from public, anon, authenticated;

-- 5. Job: 10 min después de purga-invitados (03:17 UTC) -----------------------------------------
select cron.unschedule('borrar-ficheros-invitados')
where exists (select 1 from cron.job where jobname = 'borrar-ficheros-invitados');

select cron.schedule(
    'borrar-ficheros-invitados',
    '27 3 * * *',
    $$ select public.lanzar_borrado_ficheros_pendientes(); $$
);

-- ---------------------------------------------------------------------------------------------
-- Pasos tras aplicar (una vez por proyecto):
--   1. Desplegar la Edge Function (verify_jwt = false: se autentica con el token de Vault):
--        supabase functions deploy purgar-ficheros-invitados --project-ref <ref>
--      SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase; no hay secretos que configurar.
--   2. Guardar su URL en Vault (SQL Editor):
--        select vault.create_secret('https://<ref>.supabase.co/functions/v1/purgar-ficheros-invitados',
--                                   'purga_ficheros_url', 'URL de la Edge Function purgar-ficheros-invitados');
--
-- Cómo verificar:
--   select jobname, schedule, active from cron.job order by jobname;
--     -- borrar-ficheros-invitados '27 3 * * *', purga-invitados '17 3 * * *', purge-system-logs.
--   select * from public.purgar_invitados_expirados();         -- ya no falla con 42501
--   select count(*) from public.storage_borrados_pendientes;  -- rutas en cola
--   select public.lanzar_borrado_ficheros_pendientes();        -- id de petición (o null si no hay cola)
--   select status_code, content from net._http_response order by created desc limit 1;
--     -- 200 {"procesados":N,"borrados":N,"fallidos":0,...}; la cola queda vacía.
--   select jobid, status, start_time, return_message from cron.job_run_details
--   order by start_time desc limit 10;
--
-- Rollback (vuelve al estado roto anterior; no recomendado):
--   select cron.unschedule('borrar-ficheros-invitados');
--   drop function if exists public.lanzar_borrado_ficheros_pendientes();
--   drop function if exists public.validar_token_purga_ficheros(text);
--   -- y reaplicar la función de 20260909120000 + el revoke de 20261008120000.
-- ---------------------------------------------------------------------------------------------
