-- Completa el esquema con los buckets de Storage que el código usa, ninguno tenía migración
-- (parte del hallazgo A1). Deducidos de las llamadas reales a supabase.storage.from(...):
--   - 'avatars'      src/app/dashboard/perfil/page.tsx:76,87
--   - 'fotos_sets'   src/components/MesaTrabajoClient.tsx:121,130
--   - 'exposiciones' src/app/admin/exposiciones/page.tsx:58,68
--
-- ⚠️ IMPORTANTE — igual que la migración anterior: si estos buckets ya existen en vuestro
-- proyecto de Supabase (lo más probable, dado que el código lleva tiempo subiendo archivos a
-- ellos), `insert ... on conflict do nothing` los deja intactos sin duplicar ni sobrescribir su
-- configuración actual. Revisar en el panel de Supabase (Storage) antes de aplicar si tenéis
-- dudas sobre su configuración real (público/privado, límite de tamaño).

insert into storage.buckets (id, name, public, file_size_limit)
values
    ('avatars', 'avatars', true, 2097152),        -- 2MB, coincide con el límite del cliente (perfil/page.tsx:63)
    ('fotos_sets', 'fotos_sets', true, 10485760),  -- 10MB, coincide con el límite del cliente (MesaTrabajoClient.tsx:80)
    ('exposiciones', 'exposiciones', true, 5242880) -- 5MB, banners de exposición
on conflict (id) do nothing;

-- Políticas de acceso a los objetos de cada bucket.

-- avatars: lectura pública (se muestran en Navbar, perfil, insignias); solo el propio usuario
-- puede subir/actualizar/borrar dentro de su propia carpeta (el código usa `${profile.id}/...`
-- como prefijo del path, perfil/page.tsx:71).
create policy "Avatares de lectura pública" on storage.objects
    for select using (bucket_id = 'avatars');

create policy "El usuario gestiona su propia carpeta de avatar" on storage.objects
    for insert with check (
        bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "El usuario actualiza su propia carpeta de avatar" on storage.objects
    for update using (
        bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
    );

-- fotos_sets: lectura pública (se muestran en vitrinas públicas); el path lo genera el cliente
-- como `${userData.user.id}/${Date.now()}.jpg` (MesaTrabajoClient.tsx:112), así que la misma
-- regla de carpeta por usuario aplica.
--
-- Nota de seguridad (relacionada con ADR-010 / hallazgo S5): esta política sigue permitiendo la
-- subida DIRECTA del cliente autenticado al bucket, que es precisamente lo que ADR-005 exige
-- evitar para que la limpieza de EXIF sea verificable server-side. Cerrar esta vía (revocando
-- INSERT aquí y exigiendo pasar por un Route Handler) es el paso final de la migración a EXIF
-- server-side descrita en ADR-010 §Decisión, y se deja fuera de esta migración a propósito: se
-- introduciría una regresión funcional (subir fotos dejaría de funcionar) en el mismo commit que
-- solo pretende versionar el estado actual del bucket.
create policy "Fotos de sets de lectura pública" on storage.objects
    for select using (bucket_id = 'fotos_sets');

create policy "El usuario sube fotos a su propia carpeta" on storage.objects
    for insert with check (
        bucket_id = 'fotos_sets' and (storage.foldername(name))[1] = auth.uid()::text
    );

-- exposiciones: solo banners de eventos, gestionados exclusivamente por administradores.
create policy "Banners de exposiciones de lectura pública" on storage.objects
    for select using (bucket_id = 'exposiciones');

create policy "Solo administradores suben banners de exposiciones" on storage.objects
    for insert with check (
        bucket_id = 'exposiciones' and exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

-- Verificación esperada tras aplicar (SQL Editor):
--   select id, public, file_size_limit from storage.buckets
--   where id in ('avatars','fotos_sets','exposiciones');
--   -> deben aparecer las 3 filas.
