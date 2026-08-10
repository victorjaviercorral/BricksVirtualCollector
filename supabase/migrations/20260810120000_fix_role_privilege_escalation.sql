-- Corrige la escalada de privilegios detectada en la auditoría de arquitectura (hallazgo S1).
--
-- Problema:
--   La política "Users can update own profile" restringe QUÉ FILA puede modificar cada usuario
--   (auth.uid() = id), pero no QUÉ COLUMNAS. Como `usuarios_perfil.role` es la columna que
--   gobierna el acceso a /admin/system (ver src/lib/supabase/middleware.ts), cualquier usuario
--   autenticado podía ejecutar desde el navegador, con la anon key:
--
--       update public.usuarios_perfil set role = 'sysadmin' where id = auth.uid();
--
--   y obtener privilegios de administrador del sistema.
--
-- Solución:
--   Revocar el privilegio UPDATE a nivel de columna sobre `role`. RLS sigue gobernando qué filas
--   son visibles y editables; este REVOKE añade la restricción de columna que faltaba.
--   La asignación de roles queda reservada al service_role (backoffice / consola de Supabase).
--
-- Nota: en PostgreSQL, revocar UPDATE sobre una columna concreta exige conceder explícitamente
-- UPDATE sobre las demás; un GRANT a nivel de tabla volvería a incluir `role`. Por eso se
-- enumeran las columnas editables por el propio usuario.

revoke update on public.usuarios_perfil from authenticated, anon;

grant update (
    username,
    avatar_url,
    consentimiento_version,
    consentimiento_fecha
) on public.usuarios_perfil to authenticated;

-- Verificación esperada (con una sesión de usuario normal):
--   update public.usuarios_perfil set role = 'sysadmin' where id = auth.uid();
--   -> ERROR: permission denied for column role of relation usuarios_perfil
