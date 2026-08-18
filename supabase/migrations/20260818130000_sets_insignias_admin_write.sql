-- Implementa el reparto real de insignias al cerrar una exposición (hallazgo D3, Iteración 4).
-- El TODO de admin/exposiciones/page.tsx ("Aquí deberemos calcular y repartir las insignias") y
-- el propio comentario de la migración 20260810140000 ("futura lógica de reparto al archivar una
-- exposición") ya anticipaban esto -- solo faltaba escribir la lógica y las políticas que le
-- faltaban a la tabla para poder hacerlo de forma idempotente.

-- Evita filas duplicadas para el mismo set en la misma exposición. También es lo que permite
-- hacer upsert (on conflict) desde admin/exposiciones/page.tsx: una exposición se puede
-- "Reactivar" y volver a archivar (botón ya existente), y el ranking debe recalcularse sobre las
-- mismas filas, no acumular insignias duplicadas cada vez.
do $$
begin
    alter table public.sets_insignias
        add constraint sets_insignias_set_exposicion_unique unique (set_id, exposicion_id);
exception
    when duplicate_object then null; -- ya existía (reaplicar esta migración es seguro)
end $$;

-- La migración anterior (20260810140000) solo concedía INSERT a administradores -- suficiente
-- para la primera vez que se archiva una exposición, pero un upsert que golpee una fila ya
-- existente (re-archivar tras "Reactivar") necesita también UPDATE. Se añade también DELETE por
-- si en el futuro hace falta corregir un reparto manualmente desde el panel.
create policy "Administradores corrigen insignias otorgadas" on public.sets_insignias
    for update using (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

create policy "Administradores retiran insignias otorgadas" on public.sets_insignias
    for delete using (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select conname from pg_constraint where conrelid = 'public.sets_insignias'::regclass
--   and conname = 'sets_insignias_set_exposicion_unique';           -- esperado: 1 fila
--
--   select policyname, cmd from pg_policies where tablename = 'sets_insignias'
--   order by cmd;                                                    -- esperado: 4 filas
--   (select, insert, update, delete -- una de cada)
-- ---------------------------------------------------------------------------------------------
