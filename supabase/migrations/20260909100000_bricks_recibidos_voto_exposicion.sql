-- Arregla el voto en exposiciones activas, roto desde 20260901120000 (S4).
--
-- Confirmado por E2E en vivo (08/09/2026, ver docs/testing/e2e-post-refactors-insignias-explorar.md
-- hallazgo B-09): con un set aprobado en una exposición ACTIVA, pulsar "+1 Voto" en
-- /exposicion/[id] devuelve siempre "Error al votar".
--
-- Causa: 20260901120000 endureció el `with check` de la política de INSERT de
-- `bricks_recibidos` (nombre real "Anyone can insert a brick on public sets") para exigir
--     hash_visitante = auth.uid()::text
-- -- correcto para el voto normal desde /set/[id] y /vitrina/[id]. Pero el voto de exposición
-- (src/app/exposicion/[id]/ExposicionClient.tsx:95) inserta A PROPÓSITO un hash compuesto:
--     hash_visitante = 'exposicion-' || exposicion.id || '-user-' || userId
-- para que la restricción unique(set_id, hash_visitante) no impida votar en la exposición un set
-- al que el usuario ya dio un brick "normal" (hash = su uid a secas). Los dos formatos son
-- legítimos; la política solo aceptaba el primero, así que el INSERT del voto de exposición no
-- pasaba nunca el `with check` y fallaba con violación de RLS.
--
-- La propia 20260901120000 listaba como prueba funcional #1 "votar un set en una exposición
-- ACTIVA -- debe seguir funcionando desde la app": esa prueba no llegó a ejecutarse.
--
-- ---------------------------------------------------------------------------------------------
-- DERIVA DE NOMBRES (5ª vez en este proyecto -- ver cabeceras de 20260901120000 y 20260908120000):
-- esta migración NO renombra ni crea políticas; hace `alter policy` sobre el nombre real
-- confirmado. Antes de aplicar, verificar que sigue siendo ese:
--
--   select p.polname, pg_get_expr(p.polwithcheck, p.polrelid) as with_check
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'bricks_recibidos' and p.polcmd = 'a';   -- 'a' = INSERT
--
--   Esperado: 1 fila, polname = 'Anyone can insert a brick on public sets', y el with_check con
--   las condiciones de 20260901120000 (vitrina pública, exposición activa o nula,
--   hash_visitante = auth.uid()::text). Si el nombre difiere, ajustar el `alter policy` de abajo.
-- ---------------------------------------------------------------------------------------------

-- Se reproduce el `with check` completo de 20260901120000 y solo se amplía la última condición:
-- de "hash_visitante = auth.uid()::text" a "ese formato O el compuesto de exposición". El resto
-- (vitrina publicada y pública, exposición activa cuando exposicion_id no es nulo, sesión
-- presente) se mantiene sin cambios -- sigue bloqueando el voto en exposición archivada y sigue
-- exigiendo que quien vota sea un usuario autenticado, no un tercero.
alter policy "Anyone can insert a brick on public sets" on public.bricks_recibidos
    with check (
        exists (
            select 1 from public.sets s
            join public.vitrinas v on s.vitrina_id = v.id
            where s.id = bricks_recibidos.set_id
              and v.estado = 'publicada'
              and v.visibilidad = 'pública'
        )
        and (
            exposicion_id is null
            or exists (
                select 1 from public.exposiciones_temporales
                where exposiciones_temporales.id = bricks_recibidos.exposicion_id
                  and exposiciones_temporales.estado = 'activa'
            )
        )
        and auth.uid() is not null
        and (
            hash_visitante = auth.uid()::text
            or hash_visitante = 'exposicion-' || bricks_recibidos.exposicion_id::text
                                || '-user-' || auth.uid()::text
        )
    );

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar:
--
--   1. Votar un set en una exposición ACTIVA desde /exposicion/[id] -> toast "¡Voto registrado!"
--      y el contador del ranking sube. (Antes: "Error al votar".)
--   2. Votar el MISMO set otra vez -> toast "Ya has votado por este set en esta exposición"
--      (código 23505, la restricción unique salta). El hash es determinista, así que el 2º voto
--      no cuela.
--   3. El voto normal desde /set/[id] y /vitrina/[id] sigue funcionando y sigue siendo único por
--      (set_id, uid).
--   4. Votar / apuntar un set en una exposición ARCHIVADA sigue bloqueado a nivel de BD.
--
-- Nota de producto (fuera del alcance de este arreglo): hoy la UI permite votar tu PROPIO set en
-- una exposición. Si se quiere impedir, el filtro va en ExposicionClient y/o aquí
-- (sets.usuario_id <> auth.uid()).
-- ---------------------------------------------------------------------------------------------
