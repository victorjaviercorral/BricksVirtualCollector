-- Completa el esquema con las tablas que el código ya usa mediante .from(...) pero que nunca
-- tuvieron migración (hallazgo A1 de docs/auditoria-arquitectura.md). Sin este fichero, un clon
-- limpio del repositorio arranca pero las secciones de exposiciones, bounties reclamados e
-- insignias fallan con "relation does not exist".
--
-- Las columnas de cada tabla se han derivado leyendo cada .select()/.insert()/.update() real del
-- código (no inventadas): src/app/admin/exposiciones/page.tsx, src/app/admin/moderacion/*,
-- src/app/exposicion/[id]/*, src/app/dashboard/page.tsx, src/app/dashboard/participaciones/*.
--
-- IMPORTANTE — este fichero NO se ha aplicado contra ningún proyecto de Supabase real. Si esas
-- tablas ya existen en vuestro proyecto (creadas a mano desde el dashboard, que es la hipótesis
-- más probable dado que el código las usa desde hace tiempo), aplicar este script tal cual
-- fallará por colisión de nombres o divergerá del esquema real. Antes de ejecutarlo:
--   1. Comprobar en el SQL Editor de Supabase si las tablas ya existen:
--        select table_name from information_schema.tables
--        where table_schema = 'public'
--        and table_name in ('exposiciones_temporales','exposicion_sets','sets_insignias',
--                            'bounties_reclamados');
--   2. Si existen, comparar sus columnas reales contra las de este fichero
--      (information_schema.columns) y ajustar antes de aplicar cualquier cosa.
--   3. Si NO existen, este fichero es seguro de aplicar tal cual sobre una base ya migrada con
--      las migraciones anteriores (usa `create table if not exists` como red de seguridad
--      adicional, pero no sustituye al paso 1).

-- ---------------------------------------------------------------------------------------------
-- Tabla: exposiciones_temporales
-- Eventos temáticos temporales. Solo una puede estar 'activa' a la vez (el código desactiva
-- las anteriores antes de activar una nueva, ver admin/exposiciones/page.tsx:72,116).
-- ---------------------------------------------------------------------------------------------
create table if not exists public.exposiciones_temporales (
    id uuid default uuid_generate_v4() primary key,
    titulo text not null,
    descripcion text,
    requisitos text,
    imagen_url text,
    estado text default 'activa' check (estado in ('activa', 'archivada')),
    es_continua boolean default false,
    fecha_inicio timestamptz,
    fecha_fin timestamptz,
    creado_en timestamptz default now()
);

alter table public.exposiciones_temporales enable row level security;

create policy "Exposiciones visibles para todos" on public.exposiciones_temporales
    for select using (true);

create policy "Solo administradores gestionan exposiciones" on public.exposiciones_temporales
    for all using (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

-- ---------------------------------------------------------------------------------------------
-- Tabla: exposicion_sets
-- Participación de un set en una exposición, con flujo de moderación (pendiente/aprobado/
-- rechazado). El unique(exposicion_id, set_id) es lo que hace que un segundo intento de
-- participar devuelva el error 23505 que src/app/exposicion/[id]/ExposicionClient.tsx:60
-- interpreta explícitamente como "ya estás participando".
-- ---------------------------------------------------------------------------------------------
create table if not exists public.exposicion_sets (
    id uuid default uuid_generate_v4() primary key,
    exposicion_id uuid references public.exposiciones_temporales(id) on delete cascade not null,
    set_id uuid references public.sets(id) on delete cascade not null,
    estado text default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
    creado_en timestamptz default now(),
    unique (exposicion_id, set_id)
);

alter table public.exposicion_sets enable row level security;

-- Ranking público: solo las participaciones aprobadas son visibles para cualquiera.
create policy "Participaciones aprobadas visibles para todos" on public.exposicion_sets
    for select using (estado = 'aprobado');

-- El dueño del set puede ver el estado de sus propias participaciones (pendientes incluidas).
create policy "El dueño ve sus propias participaciones" on public.exposicion_sets
    for select using (
        exists (
            select 1 from public.sets
            where sets.id = exposicion_sets.set_id and sets.usuario_id = auth.uid()
        )
    );

-- Los administradores ven la cola completa de moderación, incluidas las rechazadas.
create policy "Administradores ven todas las participaciones" on public.exposicion_sets
    for select using (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

-- Solo el dueño del set puede enviarlo a participar (src/app/exposicion/[id]/ExposicionClient.tsx:51).
create policy "El dueño del set puede enviarlo a participar" on public.exposicion_sets
    for insert with check (
        exists (
            select 1 from public.sets
            where sets.id = exposicion_sets.set_id and sets.usuario_id = auth.uid()
        )
    );

-- Solo administradores aprueban/rechazan (src/app/admin/moderacion/actions.ts).
create policy "Solo administradores moderan participaciones" on public.exposicion_sets
    for update using (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

-- ---------------------------------------------------------------------------------------------
-- Tabla: sets_insignias
-- Insignias otorgadas a un set al archivar una exposición. El reparto real todavía no está
-- implementado -- admin/exposiciones/page.tsx:106 lo marca con un TODO explícito ("Aquí
-- deberemos calcular y repartir las insignias") -- así que hoy esta tabla existe en el esquema
-- pero nada la escribe salvo inserción manual/futura lógica de servidor.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.sets_insignias (
    id uuid default uuid_generate_v4() primary key,
    set_id uuid references public.sets(id) on delete cascade not null,
    exposicion_id uuid references public.exposiciones_temporales(id) on delete set null,
    rango int,
    titulo_insignia text not null,
    fecha_otorgada timestamptz default now()
);

alter table public.sets_insignias enable row level security;

-- Mismo criterio que insignias_usuario en la migración inicial: visibles para todos.
create policy "Insignias de sets visibles para todos" on public.sets_insignias
    for select using (true);

-- Solo administradores otorgan insignias (futura lógica de reparto al archivar una exposición).
create policy "Solo administradores otorgan insignias" on public.sets_insignias
    for insert with check (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

-- ---------------------------------------------------------------------------------------------
-- Tabla: bounties_reclamados
--
-- ⚠️ NOTA ARQUITECTÓNICA (no es una decisión tomada, es una discrepancia detectada):
-- src/app/dashboard/participaciones/[id]/page.tsx lee de esta tabla, pero
-- src/app/api/bounties/claim/route.ts -- el único código que reclama un bounty de verdad --
-- escribe únicamente en public.bounties (columnas reclamado_por/estado), NUNCA en
-- bounties_reclamados. Esta tabla existe en el modelo de datos pero nada la puebla todavía: la
-- página de detalle de participación cae siempre a su rama de datos mock (documentada como deuda
-- conocida en src/app/dashboard/participaciones/[id]/page.test.tsx). Decidir si el modelo correcto
-- es "un bounty, un reclamante" (bounties.reclamado_por, el actual) o "una tabla de reclamos"
-- (esta) es una decisión de producto pendiente, no algo que esta migración deba resolver por su
-- cuenta. Se crea la tabla porque el código ya la referencia (cumple A1); no se modifica
-- api/bounties/claim/route.ts para escribir en ella.
-- ---------------------------------------------------------------------------------------------
create table if not exists public.bounties_reclamados (
    id uuid default uuid_generate_v4() primary key,
    bounty_id uuid references public.bounties(id) on delete cascade,
    usuario_id uuid references public.usuarios_perfil(id) on delete cascade not null,
    nombre_set text,
    descripcion text,
    recompensa int,
    estado text default 'pendiente',
    creado_en timestamptz default now()
);

alter table public.bounties_reclamados enable row level security;

create policy "El usuario ve sus propios reclamos" on public.bounties_reclamados
    for select using (auth.uid() = usuario_id);

create policy "Administradores ven todos los reclamos" on public.bounties_reclamados
    for select using (
        exists (
            select 1 from public.usuarios_perfil
            where usuarios_perfil.id = auth.uid()
            and usuarios_perfil.role in ('admin', 'admin_exposiciones', 'sysadmin')
        )
    );

create policy "El usuario crea sus propios reclamos" on public.bounties_reclamados
    for insert with check (auth.uid() = usuario_id);

-- ---------------------------------------------------------------------------------------------
-- Columna que falta en bricks_recibidos (creada en 20260805171025_init_schema.sql)
--
-- src/app/exposicion/[id]/page.tsx:40-43 y ExposicionClient.tsx:70-76 leen/escriben
-- bricks_recibidos.exposicion_id para contar votos por exposición, pero la migración inicial
-- nunca la definió. Nullable: los votos generales vía /api/bricks (fuera del contexto de una
-- exposición) no la usan.
-- ---------------------------------------------------------------------------------------------
alter table public.bricks_recibidos
    add column if not exists exposicion_id uuid references public.exposiciones_temporales(id) on delete set null;

-- Verificación esperada tras aplicar:
--   select table_name from information_schema.tables where table_schema='public'
--   and table_name in ('exposiciones_temporales','exposicion_sets','sets_insignias','bounties_reclamados');
--   -> deben aparecer las 4 filas.
--   select column_name from information_schema.columns
--   where table_name='bricks_recibidos' and column_name='exposicion_id';
--   -> debe aparecer 1 fila.
