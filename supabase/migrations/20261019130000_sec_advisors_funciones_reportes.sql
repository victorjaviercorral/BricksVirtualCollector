-- Incidente SEC-2026-002: avisos del linter de seguridad de Supabase que ya estaban en producción.
--
-- 1) public.handle_new_user() y public.handle_user_upgrade() (20260909110000 / 20260909130000):
--    - 0011 function_search_path_mutable: son security definer sin `set search_path`.
--    - 0028/0029 anon/authenticated_security_definer_function_executable: Postgres concede EXECUTE a
--      PUBLIC al crear la función y los default privileges de Supabase en `public` lo dan además a
--      anon/authenticated, así que salen en /rest/v1/rpc/handle_new_user y handle_user_upgrade.
--    Son funciones de TRIGGER de auth.users (on_auth_user_created AFTER INSERT, on_auth_user_upgraded
--    AFTER UPDATE). Postgres no comprueba EXECUTE al disparar un trigger, así que revocarlo no afecta
--    al alta ni al upgrade. Llamarlas por RPC tampoco hacía nada útil ("trigger functions can only be
--    called as triggers"); se revoca para cerrar la superficie y el aviso.
--    Fijar search_path = '' es seguro: el cuerpo solo usa public.usuarios_perfil (cualificada) y
--    funciones/operadores de pg_catalog (coalesce, substr, now, ||, like), que siempre se resuelven.
--    No se reescribe el cuerpo: alter function no lo toca (sin deriva respecto a las migraciones).
--
-- 2) public.reportes (0008 rls_enabled_no_policy): la migración 20260819120000 la retiraba
--    (drop table), pero en producción esa migración no llegó a aplicarse y la tabla sigue ahí, vacía,
--    con RLS sin políticas (deny-all) y TODOS los privilegios para anon y authenticated. La app no la
--    usa (ni src/, ni scripts/, ni e2e/). Arreglo mínimo, sin borrar nada: se le quitan los grants a
--    anon y authenticated y se deja sin políticas A PROPÓSITO (solo postgres/service_role).
--    Retirarla del todo (reaplicar 20260819120000) es decisión aparte del titular.
--    Desde cero la tabla no existe (20260819120000 la borró): el bloque es un no-op.
--
-- Idempotente y aplicable desde cero.

alter function public.handle_new_user() set search_path = '';
alter function public.handle_user_upgrade() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_upgrade() from public, anon, authenticated;

do $$
begin
    if to_regclass('public.reportes') is not null then
        revoke all on table public.reportes from public, anon, authenticated;
        alter table public.reportes enable row level security;
        comment on table public.reportes is
            'SEC-2026-002: sin uso en la app (retirada en 20260819120000, no aplicada en producción). Sin políticas a propósito y sin grants para anon/authenticated: solo postgres/service_role.';
    end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select proname, proconfig, proacl from pg_proc
--   where pronamespace = 'public'::regnamespace and proname in ('handle_new_user', 'handle_user_upgrade');
--   -- Esperado: proconfig = {search_path=""}; proacl sin '=X', anon ni authenticated.
--
--   select relacl from pg_class where oid = to_regclass('public.reportes');
--   -- Esperado (si existe): solo postgres y service_role.
--
--   Prueba funcional: entrar como invitado (se crea su usuarios_perfil con es_invitado = true) y
--   hacer el upgrade a cuenta (es_invitado pasa a false). Desde fuera, con la anon key:
--     POST /rest/v1/rpc/handle_new_user → 401/403/404 (ya no expuesta).
--
-- Rollback (reabre los avisos):
--   alter function public.handle_new_user() reset search_path;
--   alter function public.handle_user_upgrade() reset search_path;
--   grant execute on function public.handle_new_user() to public, anon, authenticated;
--   grant execute on function public.handle_user_upgrade() to public, anon, authenticated;
--   grant all on table public.reportes to anon, authenticated;
-- ---------------------------------------------------------------------------------------------
