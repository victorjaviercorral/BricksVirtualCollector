-- Implementa la purga automática de system_logs a 30 días.
--
-- Contexto: el runbook interno (src/app/admin/system/docs/page.tsx) y la política de privacidad
-- (legal/politica-privacidad.md §2) documentan una retención de 30 días para los logs propios de
-- la tabla `system_logs`, pero no existía ningún mecanismo que la hiciera cumplir: los logs se
-- acumulaban indefinidamente. Detectado como deuda abierta en legal/data-map.md.
--
-- Solución: pg_cron, la extensión de programación de tareas de PostgreSQL que Supabase soporta
-- de forma nativa. Un job diario borra los registros de `system_logs` con más de 30 días.

-- 1. Habilitar la extensión pg_cron.
--    En algunos proyectos de Supabase, crear esta extensión desde una migración puede fallar por
--    permisos si nunca se ha habilitado antes. Si el `CREATE EXTENSION` de abajo da error al
--    aplicar esta migración:
--      a. Ve al panel de Supabase → Database → Extensions.
--      b. Busca "pg_cron" y actívala con el interruptor (esto la crea en el esquema `pg_catalog`
--         o `extensions` según la versión del proyecto).
--      c. Vuelve a ejecutar esta migración (o solo la sección 2 en el SQL Editor).
create extension if not exists pg_cron with schema extensions;

-- Conceder al rol postgres (el que ejecuta las migraciones) acceso al esquema del scheduler.
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 2. Programar el job de purga.
--    Se usa cron.schedule con un nombre fijo ('purge-system-logs'): si la migración se
--    reejecuta, se desprograma la versión anterior antes de crear la nueva, para que el proceso
--    sea idempotente y no acumule jobs duplicados.
select cron.unschedule('purge-system-logs')
where exists (select 1 from cron.job where jobname = 'purge-system-logs');

select cron.schedule(
    'purge-system-logs',
    '0 3 * * *', -- todos los días a las 03:00 UTC
    $$ delete from public.system_logs where created_at < now() - interval '30 days'; $$
);

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar/rectificar esto en Supabase (panel → SQL Editor):
--
-- a) Confirmar que el job existe y está activo:
--      select jobid, jobname, schedule, active from cron.job;
--    Debe aparecer una fila 'purge-system-logs' con schedule '0 3 * * *' y active = true.
--
-- b) Ver el historial de ejecuciones (después de que pase al menos una ejecución):
--      select jobid, status, start_time, end_time, return_message
--      from cron.job_run_details
--      where jobid = (select jobid from cron.job where jobname = 'purge-system-logs')
--      order by start_time desc limit 10;
--
-- c) Forzar una ejecución manual sin esperar al cron (útil para validar hoy mismo):
--      delete from public.system_logs where created_at < now() - interval '30 days';
--
-- d) Si en el futuro se quiere cambiar la retención (p. ej. a 60 días), reejecutar solo la
--    sección 2 de este fichero con el nuevo intervalo — es segura de repetir.
--
-- e) Para desactivar la purga temporalmente sin borrar el job:
--      select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'purge-system-logs'), active := false);
-- ---------------------------------------------------------------------------------------------
