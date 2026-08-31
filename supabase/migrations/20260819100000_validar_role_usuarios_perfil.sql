-- Hallazgo del 19/08/2026: usuarios_perfil.role es texto libre sin validar. Se encontró una
-- fila real con role = 'admin, sysadmin' -- una sola cadena mal formada, no dos roles -- que
-- coló porque nada impedía guardar ahí cualquier valor. Efecto: los gates por subcadena
-- (`role.includes('admin')`) la dejaban pasar por casualidad, pero las políticas RLS y los
-- chequeos de comparación exacta (moderación, sets_insignias) la rechazaban con 42501 -- la
-- misma clase de bug que N7 (Iteración 3), esta vez en datos reales, no solo en código.

-- 1. Normaliza el valor mal formado conocido. No se usa un fallback genérico a 'user' para
-- cualquier valor no reconocido: eso degradaría en silencio a un admin legítimo con un valor
-- distinto que no se haya previsto aquí. Se corrige el caso conocido de forma explícita.
update public.usuarios_perfil
set role = 'admin'
where role = 'admin, sysadmin';

-- 2. Restricción para que esta clase de valor mal formado no pueda volver a guardarse. `null`
-- sigue permitido (algunas filas antiguas pueden no tener rol asignado).
do $$
begin
    alter table public.usuarios_perfil
        add constraint usuarios_perfil_role_valido
        check (role is null or role in ('user', 'admin', 'admin_exposiciones', 'sysadmin'));
exception
    when duplicate_object then null; -- ya existía (reaplicar esta migración es seguro)
end $$;

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   select id, role from usuarios_perfil where role = 'admin, sysadmin';
--   -- Esperado: 0 filas (ya normalizada)
--
--   select conname from pg_constraint where conrelid = 'public.usuarios_perfil'::regclass
--   and conname = 'usuarios_perfil_role_valido';
--   -- Esperado: 1 fila
--
--   -- Prueba de que la restricción funciona de verdad (debe fallar con una violación de check):
--   -- update usuarios_perfil set role = 'cualquier_cosa' where id = '<tu propio id>';
-- ---------------------------------------------------------------------------------------------
