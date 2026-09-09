-- S7 (hallazgo abierto de la auditoría) + Fase 6 del acceso de invitado (ADR-011):
-- fija `file_size_limit` en los tres buckets server-side.
--
-- `20260810150000_storage_buckets.sql` ya declaraba estos límites, pero con
-- `insert ... on conflict (id) do nothing`: si los buckets ya existían en el proyecto real (lo
-- normal, el código llevaba tiempo subiendo a ellos), el `do nothing` dejó su `file_size_limit`
-- como estuviera — posiblemente null (sin límite). Esta migración lo fuerza con un `update`.
--
-- El límite del cliente y el del Route Handler (api/sets/foto) no son una garantía por sí solos;
-- este es el tope que aplica el propio Storage aunque alguien llame a la API directamente.

update storage.buckets set file_size_limit = 2097152  where id = 'avatars';      -- 2 MB
update storage.buckets set file_size_limit = 10485760 where id = 'fotos_sets';   -- 10 MB
update storage.buckets set file_size_limit = 5242880  where id = 'exposiciones'; -- 5 MB

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--   select id, public, file_size_limit from storage.buckets
--   where id in ('avatars','fotos_sets','exposiciones') order by id;
--   -- Esperado: 3 filas con file_size_limit NO nulo (2097152 / 10485760 / 5242880).
--
-- Nota: el tope de 3 MB para invitados NO va aquí (un bucket tiene un único límite para todos).
-- Lo aplica api/sets/foto según `user.is_anonymous` (Fase 6).
-- ---------------------------------------------------------------------------------------------
