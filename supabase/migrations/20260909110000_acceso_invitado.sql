-- Cimientos de datos del acceso de invitado (ADR-011, Fase 1 de
-- docs/05-plan/plan-acceso-invitado-opcion-c.md).
--
-- Un invitado es una sesión anónima de Supabase (supabase.auth.signInAnonymously()): obtiene un
-- auth.uid() real, así que TODA la RLS existente le sigue aplicando. Esta migración solo añade
-- la distinción invitado/real y una única palanca de producto: un invitado no puede publicar.
--
-- Qué hace:
--   1. usuarios_perfil.es_invitado (boolean, default false) + índice parcial.
--   2. handle_new_user() pasa a marcar es_invitado desde new.is_anonymous y a dar a los
--      invitados un username 'Invitado_...' y consentimiento nulo (no aceptan términos).
--   3. Bloqueo de visibilidad='pública' para invitados en INSERT y UPDATE de vitrinas.
--   4. (Defensa en profundidad) la lectura pública de vitrinas excluye además a los invitados,
--      para que una consulta de frontend mal filtrada no pueda filtrar su contenido.
--
-- NO se tocan las políticas de bricks_recibidos / bounties_reclamados / insignias_usuario /
-- exposicion_sets: el aislamiento por auth.uid() ya está y la purga (Fase 3) se encarga del
-- resto.
--
-- ---------------------------------------------------------------------------------------------
-- ACCIÓN MANUAL DEL TITULAR (no automatizable desde el repo), imprescindible para que esto sirva:
--   Supabase → Authentication → Providers → habilitar "Anonymous Sign-Ins".
--   Opcional recomendado: Authentication → Settings → activar CAPTCHA (hCaptcha/Turnstile).
-- ---------------------------------------------------------------------------------------------
--
-- ---------------------------------------------------------------------------------------------
-- DERIVA DE NOMBRES DE POLÍTICA (6ª vez que se vigila en este proyecto — ver cabeceras de
-- 20260901120000, 20260908120000, 20260909100000). Las políticas de `vitrinas` vienen de la
-- migración inicial (20260805171025) y ninguna migración posterior las ha tocado, así que sus
-- nombres DEBERÍAN ser los de abajo. Confírmalo ANTES de aplicar:
--
--   select p.polname,
--          case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
--                        when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end as cmd,
--          pg_get_expr(p.polqual, p.polrelid)      as using_expr,
--          pg_get_expr(p.polwithcheck, p.polrelid) as with_check
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'vitrinas' order by p.polcmd, p.polname;
--
--   Esperado (5 filas):
--     SELECT "Public vitrinas are viewable by everyone"  using: (estado = 'publicada' AND visibilidad = 'pública')
--     SELECT "Users can view their own vitrinas"         using: (auth.uid() = usuario_id)
--     INSERT "Users can insert their own vitrinas"       with_check: (auth.uid() = usuario_id)
--     UPDATE "Users can update their own vitrinas"       using: (auth.uid() = usuario_id)   with_check: NULL
--     DELETE "Users can delete their own vitrinas"       using: (auth.uid() = usuario_id)
--
--   Si algún nombre difiere, ajusta los `alter policy` de abajo antes de ejecutar.
-- ---------------------------------------------------------------------------------------------


-- 1. Columna y flag ---------------------------------------------------------------------------
alter table public.usuarios_perfil
    add column if not exists es_invitado boolean not null default false;

-- Índice parcial: solo indexa las filas de invitado (minoría y efímeras). Sirve a la purga
-- (Fase 3) y a los filtros de las superficies públicas (Fase 5).
create index if not exists usuarios_perfil_es_invitado_idx
    on public.usuarios_perfil (es_invitado) where es_invitado;

-- Red de seguridad: si ya existiera alguna sesión anónima creada antes de esta migración
-- (no debería, el toggle aún no está activo), su perfil queda correctamente marcado.
update public.usuarios_perfil p
set es_invitado = true
from auth.users u
where u.id = p.id
  and coalesce(u.is_anonymous, false) = true
  and p.es_invitado = false;


-- 2. Trigger de alta --------------------------------------------------------------------------
-- handle_new_user() se dispara en CUALQUIER insert en auth.users (20260808120000), así que un
-- invitado ya recibía fila en usuarios_perfil automáticamente; lo que faltaba es marcarla.
-- Un invitado no aporta username ni acepta términos: se le asigna 'Invitado_<8 hex>' y
-- consentimiento nulo. El modo invitado no trata datos personales (ver Fase 8 legal); el
-- consentimiento real se fija en el upgrade a cuenta (Fase 4).
-- Se mantiene el estilo de la función original (security definer, sin set search_path) para no
-- introducir cambios fuera del alcance de esta fase.
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.usuarios_perfil (
        id,
        username,
        role,
        es_invitado,
        consentimiento_version,
        consentimiento_fecha
    )
    values (
        new.id,
        case
            when coalesce(new.is_anonymous, false)
                then 'Invitado_' || substr(new.id::text, 1, 8)
            else coalesce(
                new.raw_user_meta_data ->> 'username',
                'Coleccionista_' || substr(new.id::text, 1, 8)
            )
        end,
        'user',
        coalesce(new.is_anonymous, false),
        case when coalesce(new.is_anonymous, false)
             then null
             else new.raw_user_meta_data ->> 'terms_version'
        end,
        case when coalesce(new.is_anonymous, false)
             then null
             else now()
        end
    );
    return new;
end;
$$ language plpgsql security definer;

-- El trigger on_auth_user_created (20260808120000) ya apunta a esta función; create or replace
-- basta, no hace falta recrearlo.


-- 3. Bloqueo de publicación para invitados ---------------------------------------------------
-- Distinguir invitado en RLS: el JWT lleva el claim is_anonymous.
--   coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
-- Cuando la escritura llega vía service_role (semilla, Route Handlers) auth.jwt() es null →
-- coalesce da false → se trata como cuenta real → puede publicar. Correcto.
--
-- Un invitado PUEDE crear y editar vitrinas (su sandbox); solo no puede ponerlas 'pública'.

alter policy "Users can insert their own vitrinas" on public.vitrinas
    with check (
        auth.uid() = usuario_id
        and (
            not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
            or visibilidad <> 'pública'
        )
    );

-- La política de UPDATE original solo tenía `using` (qué filas), sin `with check` (qué valores
-- puede dejar). Se añade el mismo `using` y un `with check` que replica la condición del INSERT:
-- así un invitado tampoco puede pasar una vitrina suya a 'pública' con un UPDATE.
alter policy "Users can update their own vitrinas" on public.vitrinas
    using (auth.uid() = usuario_id)
    with check (
        auth.uid() = usuario_id
        and (
            not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
            or visibilidad <> 'pública'
        )
    );


-- 4. Defensa en profundidad: exclusión en la lectura pública -------------------------------
-- Con el punto 3 un invitado ya no puede tener una vitrina 'pública', así que la política de
-- SELECT pública (estado='publicada' AND visibilidad='pública') ya no le alcanza. Aun así se
-- añade el filtro explícito por es_invitado: si en el futuro una migración relajara el punto 3,
-- o si el upgrade (Fase 4) dejara un estado transitorio inconsistente, el contenido de un
-- invitado seguiría sin ser visible para terceros. El aislamiento lo garantiza el motor.
alter policy "Public vitrinas are viewable by everyone" on public.vitrinas
    using (
        estado = 'publicada'
        and visibilidad = 'pública'
        and not exists (
            select 1 from public.usuarios_perfil p
            where p.id = vitrinas.usuario_id and p.es_invitado
        )
    );


-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   -- 4.1 La columna existe
--   select column_name, data_type, is_nullable, column_default
--   from information_schema.columns
--   where table_name = 'usuarios_perfil' and column_name = 'es_invitado';
--   -- Esperado: 1 fila (boolean, NO, false).
--
--   -- 4.2 El índice existe
--   select indexname from pg_indexes
--   where tablename = 'usuarios_perfil' and indexname = 'usuarios_perfil_es_invitado_idx';
--   -- Esperado: 1 fila.
--
--   -- 4.3 Las 3 políticas de vitrinas llevan la condición de invitado
--   select p.polname, pg_get_expr(p.polwithcheck, p.polrelid) as with_check,
--          pg_get_expr(p.polqual, p.polrelid) as using_expr
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'vitrinas'
--     and p.polname in (
--       'Users can insert their own vitrinas',
--       'Users can update their own vitrinas',
--       'Public vitrinas are viewable by everyone'
--     )
--   order by p.polname;
--   -- Esperado: insert/update con "is_anonymous" en with_check; el SELECT público con
--   --           "es_invitado" en using_expr.
--
-- Prueba funcional real (la que de verdad cierra la Fase 1) — requiere el toggle de Anonymous
-- Sign-Ins ya activo:
--   1. En producción, consola del navegador (sin sesión):
--        const { data, error } = await window.__sb.auth.signInAnonymously()   // o el cliente que exponga la app
--      Debe devolver una sesión con user.is_anonymous === true.
--   2. select id, username, es_invitado, consentimiento_version
--      from public.usuarios_perfil where es_invitado order by creado_en desc limit 1;
--      -- Esperado: es_invitado = true, username 'Invitado_...', consentimiento_version null.
--   3. Con esa sesión anónima:
--        insert into public.vitrinas (usuario_id, nombre, visibilidad)
--        values (auth.uid(), 'test invitado', 'pública');   -- DEBE FALLAR (RLS with check)
--        insert into public.vitrinas (usuario_id, nombre, visibilidad)
--        values (auth.uid(), 'test invitado', 'privada');   -- DEBE FUNCIONAR (sandbox)
--   4. Con esa sesión anónima, crear un set / brick / reclamo dentro de su sandbox → funciona.
--   5. update public.usuarios_perfil set role = 'sysadmin' where id = auth.uid();
--      -- DEBE FALLAR (permission denied for column role — sigue vigente 20260810120000).
--
-- Rollback (si se decide no seguir con el modelo de invitado):
--   -- revertir políticas a su forma original (init_schema):
--   alter policy "Users can insert their own vitrinas" on public.vitrinas
--       with check (auth.uid() = usuario_id);
--   alter policy "Users can update their own vitrinas" on public.vitrinas
--       using (auth.uid() = usuario_id);      -- (with check vuelve a NULL con drop+create)
--   alter policy "Public vitrinas are viewable by everyone" on public.vitrinas
--       using (estado = 'publicada' and visibilidad = 'pública');
--   -- y restaurar handle_new_user() a la versión de 20260808120000.
--   -- La columna es_invitado puede quedarse (default false, sin efecto) o eliminarse.
-- ---------------------------------------------------------------------------------------------
