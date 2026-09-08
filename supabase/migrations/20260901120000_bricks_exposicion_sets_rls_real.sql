-- Corrige dos migraciones que se dieron por aplicadas y no lo estaban -- verificado por el
-- titular consultando pg_policy directamente (19/08/2026, cuarta vez que se detecta este patrón
-- de deriva en este proyecto): los nombres reales de las políticas en producción no coinciden
-- con los que asumían las migraciones anteriores, así que `alter policy` con el nombre
-- equivocado no dio error pero tampoco cerró nada. Además cierra S4 (RLS estricta de
-- bricks_recibidos) en la misma pasada, porque toca la misma política.
--
-- Estado real confirmado (pg_policy, no pg_policies -- ver la nota de la consulta usada):
--   bricks_recibidos: la política de INSERT real se llama "Anyone can insert a brick on public
--   sets" (no "Anyone can insert a brick") y su condición real exige que el set pertenezca a una
--   vitrina publicada y pública -- nada que ver con exposiciones. Se preserva esa condición y se
--   añaden las nuevas encima, no se sustituye.
--
--   exposicion_sets: "El dueño del set puede enviarlo a participar" (nombre correcto) solo
--   comprueba propiedad del set, sin el filtro de exposición activa que se le quiso añadir en
--   20260819110000 -- esa migración no llegó a aplicarse. Además hay una SEGUNDA política de
--   INSERT sin rastrear en ningún fichero ("Users can submit their own sets") que haría inútil
--   cualquier arreglo sobre la primera, porque las políticas de INSERT se combinan con OR.

-- 1. bricks_recibidos: preserva la condición real existente (vitrina publicada y pública) y
-- añade (a) el bloqueo de voto en exposición archivada (el que se creía cerrado desde
-- 20260819110000) y (b) S4: solo un usuario autenticado puede votar como sí mismo
-- (hash_visitante = auth.uid()). Los bricks de recompensa de bounties ya no pasan por esta
-- política -- api/bounties/claim/route.ts los inserta con la service_role key (bypassa RLS),
-- ver ese fichero.
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
        and hash_visitante = auth.uid()::text
    );

-- 2. exposicion_sets: añade el filtro de exposición activa que 20260819110000 pretendía aplicar
-- (esta vez con el nombre real, confirmado).
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

-- 3. Retira la política de INSERT duplicada y sin rastrear: dejarla activa anularía el punto 2
-- (las políticas de INSERT se combinan con OR -- bastaría con que UNA lo permita).
drop policy if exists "Users can submit their own sets" on public.exposicion_sets;

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor) -- repetir la consulta que detectó el problema:
--
--   select p.polname as policyname, p.polcmd as cmd,
--          pg_get_expr(p.polwithcheck, p.polrelid) as with_check
--   from pg_policy p
--   join pg_class c on c.oid = p.polrelid
--   where c.relname in ('bricks_recibidos', 'exposicion_sets')
--   order by c.relname, p.polcmd;
--
--   Esperado:
--   - bricks_recibidos INSERT: el with_check incluye ahora las tres condiciones (vitrina
--     pública, exposición activa u nula, hash_visitante = auth.uid()).
--   - exposicion_sets: solo UNA política de INSERT ("El dueño del set puede enviarlo a
--     participar"), con el filtro de exposición activa añadido. "Users can submit their own
--     sets" ya no aparece.
--
-- Prueba funcional real:
--   1. Votar un set en una exposición ACTIVA -- debe seguir funcionando desde la app.
--   2. Intentar votar (o apuntar un set) en una exposición ARCHIVADA -- ya bloqueado en la UI
--      (ExposicionClient.tsx), pero ahora también a nivel de base de datos.
--   3. Reclamar un bounty -- debe seguir concediendo los bricks de recompensa (ahora vía
--      service_role en api/bounties/claim/route.ts, no vía esta política).
-- ---------------------------------------------------------------------------------------------
