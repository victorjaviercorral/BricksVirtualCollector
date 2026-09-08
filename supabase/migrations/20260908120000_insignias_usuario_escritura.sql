-- Hace escribible `public.insignias_usuario`, que existe desde la migración inicial
-- (20260805171025) y hasta hoy no la usaba nadie: tiene `unique(usuario_id, insignia)` --
-- exactamente lo que permite un upsert idempotente, igual que sets_insignias en 20260818130000 --
-- pero su ÚNICA política era de SELECT ("Insignias are viewable by everyone"), así que con la
-- anon key no había forma de insertar una fila.
--
-- Con esto queda cerrado el sistema de insignias de usuario: `src/lib/insignias-usuario.ts`
-- calcula el catálogo contra datos reales en cada carga (siempre coherente) y
-- `src/app/api/insignias/sync/route.ts` persiste aquí las desbloqueadas para tener FECHA de
-- obtención y poder avisar de un desbloqueo nuevo. El handler recalcula en servidor: nunca
-- inserta lo que le diga el cliente.
--
-- ---------------------------------------------------------------------------------------------
-- NOTA SOBRE DERIVA DE NOMBRES (cuarta vez detectada en este proyecto, ver la cabecera de
-- 20260901120000): los nombres de política reales en Supabase no siempre coinciden con los que
-- registran las migraciones. Por eso esta migración NO renombra, NO altera y NO da por supuesta
-- ninguna política existente: solo crea las suyas, con nombre propio, precedidas de un
-- `drop policy if exists` sobre ESE mismo nombre para que reaplicarla sea seguro.
--
-- Antes de aplicar, conviene confirmar que no hay ya una política de INSERT sobre esta tabla
-- bajo otro nombre (las de INSERT se combinan con OR, así que una permisiva sin rastrear
-- anularía el efecto de la de aquí):
--
--   select p.polname,
--          case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
--                        when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end as cmd,
--          pg_get_expr(p.polqual, p.polrelid)      as using_expr,
--          pg_get_expr(p.polwithcheck, p.polrelid) as with_check
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'insignias_usuario' order by p.polcmd;
--
--   Esperado ANTES de aplicar: 1 fila, SELECT. Si aparece alguna de INSERT, revisar su condición
--   antes de continuar.
-- ---------------------------------------------------------------------------------------------

-- 1. El usuario registra sus propias insignias, y solo las suyas.
--
-- No se conceden UPDATE ni DELETE a propósito: el upsert usa ON CONFLICT DO NOTHING (INSERT
-- basta) y las insignias no se revocan -- si alguien baja de umbral tras borrar sets, conserva lo
-- que ya consiguió y es la barra de progreso la que refleja el estado real. Menos privilegio
-- concedido es menos superficie que auditar.
drop policy if exists "El usuario registra sus propias insignias" on public.insignias_usuario;
create policy "El usuario registra sus propias insignias" on public.insignias_usuario
    for insert with check (auth.uid() = usuario_id);

-- 2. Índice para el Mosaico Comunitario, que lee los últimos hitos de TODA la comunidad
-- ordenados por fecha. El unique(usuario_id, insignia) ya indexa la búsqueda por usuario, pero no
-- sirve para este orden.
create index if not exists insignias_usuario_otorgado_en_idx
    on public.insignias_usuario (otorgado_en desc);

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select policyname, cmd from pg_policies where tablename = 'insignias_usuario' order by cmd;
--   -- Esperado: 2 filas -- el SELECT que ya existía y el INSERT nuevo.
--
--   select indexname from pg_indexes
--   where tablename = 'insignias_usuario' and indexname = 'insignias_usuario_otorgado_en_idx';
--   -- Esperado: 1 fila.
--
-- Prueba funcional real (es la que de verdad cierra la verificación):
--   1. Abrir /dashboard/insignias con una cuenta que tenga al menos un set.
--      select insignia, otorgado_en from public.insignias_usuario where usuario_id = '<tu uuid>';
--      -- Esperado: una fila por insignia desbloqueada.
--   2. RECARGAR la página y repetir la consulta.
--      -- Esperado: EXACTAMENTE las mismas filas, con la MISMA otorgado_en. Si se duplican o la
--      -- fecha cambia, el upsert no está siendo idempotente y hay que pararlo.
--   3. Con una segunda cuenta, comprobar que sus hitos aparecen en el Mosaico Comunitario de la
--      primera (la política de SELECT es pública, ese es el diseño).
-- ---------------------------------------------------------------------------------------------
