-- Incidente CI-2026-005: en producción no existen ni la función `increment_bricks` ni el trigger
-- `on_brick_inserted` de `20260806000000_bricks_trigger.sql` (deriva: esa migración no se aplicó allí;
-- en un proyecto montado desde cero, como bvc-e2e, sí están). Consecuencia: `sets.bricks_recibidos` y
-- `usuarios_perfil.total_bricks_recibidos` se quedaron en 0 aunque `bricks_recibidos` tiene filas.
-- `sets.bricks_recibidos` se lee en /set/[id], /perfil/[id] (bricks por set) y en `maxBricksUnSet`
-- (src/lib/insignias-usuario.ts). Ningún otro camino mantiene esos contadores (ni RPC ni código de
-- servidor: api/bricks, ExposicionClient y api/bounties/claim solo insertan en bricks_recibidos y
-- delegan en el trigger), así que añadir el trigger no cuenta dos veces.
--
-- Qué hace (idempotente, aplicable desde cero):
--   1. Reemplaza `public.increment_bricks()` con el mismo comportamiento en INSERT y añade el DELETE:
--      desde 20260909120000 hay un camino de borrado de bricks (la purga de invitados borra sus votos
--      sobre sets ajenos), y con solo-incremento el contador volvería a desviarse. Nunca baja de 0.
--      security definer (actualiza filas de otros usuarios) con search_path = '' y nombres cualificados.
--   2. Triggers `on_brick_inserted` (AFTER INSERT) y `on_brick_deleted` (AFTER DELETE).
--   3. Sin EXECUTE para public/anon/authenticated (un trigger no lo necesita; cierra los avisos
--      0011/0028/0029 del linter que ya salían en bvc-e2e).
--   4. Backfill: deja los dos contadores iguales al recuento real de `bricks_recibidos`. No borra filas.
--      Va DESPUÉS de crear los triggers y en la misma transacción, para no perder inserciones.
--
-- Nota: `usuarios_perfil.total_bricks_recibidos` no se usa en la app (el total se cuenta siempre de
-- `bricks_recibidos`) y puede volver a desviarse al borrar un set entero (la cascada borra el set antes
-- que sus bricks, y el trigger ya no encuentra al dueño). Se mantiene como antes, sin más cambios.

create or replace function public.increment_bricks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        update public.sets
        set bricks_recibidos = coalesce(bricks_recibidos, 0) + 1
        where id = new.set_id;

        update public.usuarios_perfil
        set total_bricks_recibidos = coalesce(total_bricks_recibidos, 0) + 1
        where id = (select s.usuario_id from public.sets s where s.id = new.set_id);

        return new;
    elsif tg_op = 'DELETE' then
        update public.sets
        set bricks_recibidos = greatest(coalesce(bricks_recibidos, 0) - 1, 0)
        where id = old.set_id;

        update public.usuarios_perfil
        set total_bricks_recibidos = greatest(coalesce(total_bricks_recibidos, 0) - 1, 0)
        where id = (select s.usuario_id from public.sets s where s.id = old.set_id);

        return old;
    end if;
    return null;
end;
$$;

comment on function public.increment_bricks() is
    'CI-2026-005: mantiene sets.bricks_recibidos y usuarios_perfil.total_bricks_recibidos al insertar o borrar en bricks_recibidos.';

revoke execute on function public.increment_bricks() from public, anon, authenticated;

drop trigger if exists on_brick_inserted on public.bricks_recibidos;
create trigger on_brick_inserted
    after insert on public.bricks_recibidos
    for each row execute function public.increment_bricks();

drop trigger if exists on_brick_deleted on public.bricks_recibidos;
create trigger on_brick_deleted
    after delete on public.bricks_recibidos
    for each row execute function public.increment_bricks();

-- Backfill (solo toca las filas que no cuadran) ---------------------------------------------------
update public.sets s
set bricks_recibidos = c.n
from (
    select s2.id, count(b.id)::int as n
    from public.sets s2
    left join public.bricks_recibidos b on b.set_id = s2.id
    group by s2.id
) c
where c.id = s.id
  and s.bricks_recibidos is distinct from c.n;

update public.usuarios_perfil u
set total_bricks_recibidos = c.n
from (
    select u2.id, count(b.id)::int as n
    from public.usuarios_perfil u2
    left join public.sets s on s.usuario_id = u2.id
    left join public.bricks_recibidos b on b.set_id = s.id
    group by u2.id
) c
where c.id = u.id
  and u.total_bricks_recibidos is distinct from c.n;

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select tgname, tgenabled from pg_trigger where tgrelid = 'public.bricks_recibidos'::regclass and not tgisinternal;
--   -- Esperado: on_brick_deleted O, on_brick_inserted O.
--
--   select count(*) filter (where s.bricks_recibidos is distinct from (select count(*) from public.bricks_recibidos b where b.set_id = s.id)) as sets_descuadrados
--   from public.sets s;
--   -- Esperado: 0.
--
-- Rollback:
--   drop trigger if exists on_brick_deleted on public.bricks_recibidos;
--   drop trigger if exists on_brick_inserted on public.bricks_recibidos;
--   drop function if exists public.increment_bricks();
-- ---------------------------------------------------------------------------------------------
