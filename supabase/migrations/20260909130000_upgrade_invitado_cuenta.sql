-- Fase 4 del plan de acceso de invitado (ADR-011): upgrade de invitado a cuenta real.
--
-- Cuando un invitado añade email + contraseña (supabase.auth.updateUser) y confirma el email,
-- Supabase marca `auth.users.is_anonymous = false` — pero `usuarios_perfil.es_invitado` seguiría
-- en `true` y el perfil arrastraría el `username = 'Invitado_...'` y el consentimiento nulo.
-- Este trigger sincroniza el perfil en el momento en que `is_anonymous` pasa de true a false.
--
-- Los datos creados como invitado se conservan: el `auth.uid()` no cambia, así que sus vitrinas,
-- sets, fotos, insignias y reclamos siguen siendo suyos. Al quedar `es_invitado = false`, la RLS
-- de `20260909110000` le permite ya publicar y su contenido entra en las superficies públicas.

create or replace function public.handle_user_upgrade()
returns trigger as $$
begin
    if coalesce(old.is_anonymous, false) = true
       and coalesce(new.is_anonymous, false) = false then

        update public.usuarios_perfil
        set es_invitado = false,
            -- El invitado no eligió username; se le da uno de cuenta si aún tiene el de invitado.
            username = case
                when username like 'Invitado\_%' escape '\'
                    then coalesce(
                        new.raw_user_meta_data ->> 'username',
                        'Coleccionista_' || substr(new.id::text, 1, 8)
                    )
                else username
            end,
            -- Ahora sí acepta la Política de Privacidad + Términos (checkbox del modal de upgrade,
            -- que hace updateUser({ data: { terms_version } })).
            consentimiento_version = coalesce(
                new.raw_user_meta_data ->> 'terms_version',
                consentimiento_version
            ),
            consentimiento_fecha = now()
        where id = new.id;
    end if;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_upgraded on auth.users;
create trigger on_auth_user_upgraded
    after update on auth.users
    for each row execute function public.handle_user_upgrade();

-- ---------------------------------------------------------------------------------------------
-- Cómo verificar tras aplicar (SQL Editor):
--
--   -- 1. El trigger existe
--   select tgname from pg_trigger where tgname = 'on_auth_user_upgraded';
--   -- Esperado: 1 fila.
--
--   -- 2. Prueba funcional real (la que cierra la Fase 4):
--   --   a. Entrar como invitado en la app, crear una vitrina y un set.
--   --   b. Desde el banner de modo invitado, "Guardar mi colección" → email real + contraseña +
--   --      aceptar términos. Confirmar el email desde el enlace que llega.
--   --   c. Comprobar:
--   --        select es_invitado, username, consentimiento_version, consentimiento_fecha
--   --        from public.usuarios_perfil where id = '<uid>';
--   --        -- Esperado: es_invitado = false, username 'Coleccionista_...' (o el elegido),
--   --        --           consentimiento_version = 'v1.0', fecha reciente.
--   --        select count(*) from public.vitrinas where usuario_id = '<uid>';  -- la vitrina sigue
--   --        select count(*) from public.sets     where usuario_id = '<uid>';  -- el set sigue
--   --   d. Publicar esa vitrina (visibilidad = 'pública') → ahora se permite y aparece en /galeria.
--   --
--   -- Nota: si Supabase Auth NO tiene activada la confirmación de email, `is_anonymous` pasa a
--   -- false en el propio updateUser y el trigger se dispara igual.
--
-- Rollback:
--   drop trigger if exists on_auth_user_upgraded on auth.users;
--   drop function if exists public.handle_user_upgrade();
-- ---------------------------------------------------------------------------------------------
