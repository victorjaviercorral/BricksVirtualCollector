-- Completa columnas que el código ya escribe/lee pero que nunca se migraron. Detectadas al
-- reescribir /perfil/[id], /set/[id] y /mesa-de-trabajo/[id] contra datos reales (iteración 3),
-- comparando cada .insert()/.update() del código de producción contra las columnas reales de
-- cada tabla. Ninguna se había detectado antes porque los tests existentes mockean el cliente de
-- Supabase por completo -- nada en la suite valida que una columna exista de verdad.
--
-- ⚠️ Aplicar con el mismo cuidado que las dos migraciones anteriores: comprobar primero si estas
-- columnas ya existen en el proyecto real (información en information_schema.columns) antes de
-- asumir que faltan.

-- ---------------------------------------------------------------------------------------------
-- usuarios_perfil.alias
-- Usada en: src/app/dashboard/perfil/page.tsx (formulario "Alias (Opcional)", lee y actualiza),
-- src/app/v/[id]/page.tsx, src/app/admin/moderacion/page.tsx (nombre del remitente).
-- Sin esta columna, actualizar el alias desde /dashboard/perfil falla con "column does not
-- exist", y las vitrinas públicas y la cola de moderación muestran username en vez de alias.
-- ---------------------------------------------------------------------------------------------
alter table public.usuarios_perfil
    add column if not exists alias text;

-- La migración 20260810120000_fix_role_privilege_escalation.sql (iteración 1) revocó UPDATE
-- sobre toda la tabla y concedió de vuelta solo un listado explícito de columnas seguras. No
-- incluía 'alias' porque esta columna no existía en el esquema conocido en ese momento -- no fue
-- una decisión de excluirla, fue un hueco de información. Sin este GRANT, el formulario de alias
-- seguiría fallando con "permission denied for column alias" incluso después de crear la
-- columna arriba. No se modifica la migración de iteración 1 (inmutable, igual que un ADR
-- aceptado): se corrige aquí, hacia delante.
grant update (alias) on public.usuarios_perfil to authenticated;

-- ---------------------------------------------------------------------------------------------
-- sets.num_set y sets.notas
-- Usadas en: src/components/MesaTrabajoClient.tsx (el formulario real de "Añadir Set", líneas
-- 139-147: inserta num_set y notas junto a las columnas que sí existían). Sin estas dos
-- columnas, CADA intento de crear un set nuevo desde /mesa-de-trabajo falla en el INSERT --
-- es decir, la funcionalidad central del producto (añadir sets a una vitrina) está rota contra
-- cualquier proyecto de Supabase que solo tenga aplicada la migración inicial.
-- ---------------------------------------------------------------------------------------------
alter table public.sets
    add column if not exists num_set text,
    add column if not exists notas text;

-- Verificación esperada tras aplicar:
--   select column_name from information_schema.columns
--   where table_name = 'usuarios_perfil' and column_name = 'alias';
--   select column_name from information_schema.columns
--   where table_name = 'sets' and column_name in ('num_set', 'notas');
--   -> deben aparecer 1 y 2 filas respectivamente.
--   Con una sesión de usuario normal: update usuarios_perfil set alias = 'Test' where id = auth.uid();
--   -> debe tener éxito (no "permission denied").
