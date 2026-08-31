-- Retira la tabla `reportes` (hallazgo S6 / S7 de la auditoría original): sin ningún consumidor
-- en src/ -- no hay UI de denuncia en ningún sitio del código, solo el esquema. Confirmado por
-- el titular (19/08/2026): fue una idea inicial que quedó obsoleta, se retira en vez de
-- construir la funcionalidad que nunca se pidió que existiera.
--
-- Sin dependencias: ninguna tabla tiene una FK hacia reportes, y su política "deny-all" (RLS sin
-- ninguna política de escritura, S7) nunca fue explotable porque nunca hubo forma de llegar a
-- escribir en ella desde la aplicación.

drop table if exists public.reportes;

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select table_name from information_schema.tables
--   where table_schema='public' and table_name='reportes';
--   -- Esperado: 0 filas
-- ---------------------------------------------------------------------------------------------
