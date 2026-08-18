-- Adapta bounties_reclamados al modelo decidido en la Iteración 4 (hallazgo D1,
-- docs/05-plan/plan-intervencion-post-iteracion-3.md): un bounty puede reclamarlo cualquier
-- número de personas -- no hay un único ganador que lo cierre para el resto. Cada reclamo es su
-- propia fila; la recompensa completa se concede a cada reclamante.
--
-- Esto sustituye el modelo anterior (bounties.estado/reclamado_por, bloqueo atómico de un solo
-- ganador) implementado en 20260810140000 y en api/bounties/claim/route.ts hasta esta fecha.
-- bounties.estado se conserva -- ahora significa "¿el bounty sigue abierto a reclamos?",
-- gestionado por un administrador vía /admin/bounties, no por el propio acto de reclamar.
--
-- Verificación previa a aplicar (SQL Editor):
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='bounties_reclamados' order by ordinal_position;
-- Si ya existe una columna set_id, el primer bloque es un no-op seguro (add column if not exists).

alter table public.bounties_reclamados
    add column if not exists set_id uuid references public.sets(id) on delete set null;

comment on column public.bounties_reclamados.set_id is
    'Set con el que se reclamó el bounty (api/bounties/claim/route.ts). Nullable: los reclamos '
    'anteriores a esta migración no lo tienen.';

-- Evita que la misma persona reclame el mismo bounty dos veces. Es la comprobación atómica que
-- sustituye al UPDATE condicional de antes -- con múltiples ganadores ya no hay una fila de
-- `bounties` que bloquear, así que la atomicidad la da esta constraint sobre el INSERT: dos
-- peticiones concurrentes del mismo usuario para el mismo bounty, una tendrá éxito y la otra
-- recibirá el error 23505 que api/bounties/claim/route.ts interpreta como "ya reclamado" -- el
-- mismo patrón que ya usan bricks_recibidos (unique(set_id, hash_visitante)) y exposicion_sets
-- (unique(exposicion_id, set_id)).
do $$
begin
    alter table public.bounties_reclamados
        add constraint bounties_reclamados_bounty_usuario_unique unique (bounty_id, usuario_id);
exception
    when duplicate_object then null; -- ya existía (reaplicar esta migración es seguro)
end $$;

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='bounties_reclamados' and column_name='set_id';
--   -- Esperado: 1 fila, data_type = uuid
--
--   select conname from pg_constraint
--   where conrelid = 'public.bounties_reclamados'::regclass
--   and conname = 'bounties_reclamados_bounty_usuario_unique';
--   -- Esperado: 1 fila
-- ---------------------------------------------------------------------------------------------
