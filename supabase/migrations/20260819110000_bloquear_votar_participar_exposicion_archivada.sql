-- Hallazgo confirmado por el titular al probar D3 (19/08/2026): nada impedía votar o
-- participar en una exposición ya archivada. La UI ya oculta ambos botones cuando
-- exposicion.estado !== 'activa' (ExposicionClient.tsx:120 y :193), pero eso es solo
-- cosmético -- las políticas RLS de escritura no comprobaban el estado de la exposición en
-- absoluto, así que una petición directa a la API de Supabase (sin pasar por la UI) podía votar
-- o apuntarse igualmente. Es el mismo tipo de brecha que ya se cerró en otros sitios del
-- proyecto (S2/S3: autorización real en servidor, no solo ocultar el botón).
--
-- Efecto además sobre H5 (docs/05-plan/plan-intervencion-post-iteracion-3.md): el ranking de
-- exposicion/[id]/page.tsx se recalcula en vivo desde bricks_recibidos: si se pudiera votar tras
-- archivar, el histórico de una exposición cerrada podría seguir cambiando por debajo del
-- reparto ya registrado en sets_insignias. Esta migración es lo que hace que ese histórico sea
-- fiable de verdad.

-- 1. bricks_recibidos: solo se permite votar (con exposicion_id) si esa exposición sigue activa.
-- Los bricks sin exposicion_id (votos normales fuera de una exposición) no se ven afectados.
alter policy "Anyone can insert a brick" on public.bricks_recibidos
    with check (
        exposicion_id is null
        or exists (
            select 1 from public.exposiciones_temporales
            where exposiciones_temporales.id = bricks_recibidos.exposicion_id
            and exposiciones_temporales.estado = 'activa'
        )
    );

-- 2. exposicion_sets: solo se permite apuntar un set nuevo si la exposición sigue activa,
-- además de seguir exigiendo que el set sea del propio usuario (comprobación ya existente).
alter policy "El dueño del set puede enviarlo a participar" on public.exposicion_sets
    with check (
        exists (
            select 1 from public.sets
            where sets.id = exposicion_sets.set_id and sets.usuario_id = auth.uid()
        )
        and exists (
            select 1 from public.exposiciones_temporales
            where exposiciones_temporales.id = exposicion_sets.exposicion_id
            and exposiciones_temporales.estado = 'activa'
        )
    );

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select polname, pg_get_expr(polwithcheck, polrelid) as with_check
--   from pg_policy
--   where polname in ('Anyone can insert a brick', 'El dueño del set puede enviarlo a participar');
--   -- Esperado: ambas incluyen ahora una referencia a exposiciones_temporales.estado
--
-- Prueba funcional real (con una exposición ya archivada y sesión de un usuario normal):
--   insert into bricks_recibidos (set_id, hash_visitante, exposicion_id)
--   values ('<id de un set aprobado en esa exposición>', 'prueba-manual', '<id de la exposición archivada>');
--   -- Esperado: error de RLS (42501), no un insert silencioso
-- ---------------------------------------------------------------------------------------------
