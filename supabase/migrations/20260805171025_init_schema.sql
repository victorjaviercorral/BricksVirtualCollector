-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: usuarios_perfil
create table public.usuarios_perfil (
    id uuid references auth.users on delete cascade not null primary key,
    username text,
    avatar_url text,
    role text default 'user'::text,
    total_bricks_recibidos int default 0,
    total_visitas int default 0,
    consentimiento_version text,
    consentimiento_fecha timestamptz default now(),
    creado_en timestamptz default now()
);

-- Table: vitrinas
create table public.vitrinas (
    id uuid default uuid_generate_v4() primary key,
    usuario_id uuid references public.usuarios_perfil(id) on delete cascade not null,
    nombre text not null,
    descripcion text,
    estado text default 'borrador' check (estado in ('borrador', 'publicada', 'eliminada')),
    visibilidad text default 'privada' check (visibilidad in ('pública', 'privada', 'privada_enlace')),
    creado_en timestamptz default now(),
    actualizado_en timestamptz default now()
);

-- Table: sets
create table public.sets (
    id uuid default uuid_generate_v4() primary key,
    vitrina_id uuid references public.vitrinas(id) on delete cascade not null,
    usuario_id uuid references public.usuarios_perfil(id) on delete cascade not null,
    nombre text not null,
    num_piezas int check (num_piezas >= 0),
    tematica text,
    anio_lanzamiento int,
    estado text,
    bricks_recibidos int default 0,
    creado_en timestamptz default now()
);

-- Table: fotos
create table public.fotos (
    id uuid default uuid_generate_v4() primary key,
    set_id uuid references public.sets(id) on delete cascade not null,
    url text not null,
    orden int default 0
);

-- Table: reportes
create table public.reportes (
    id uuid default uuid_generate_v4() primary key,
    tipo_contenido text not null check (tipo_contenido in ('vitrina', 'set')),
    contenido_id uuid not null,
    motivo text not null,
    estado text default 'pendiente' check (estado in ('pendiente', 'revisado_ok', 'revisado_eliminado')),
    creado_en timestamptz default now()
);

-- Gamification Tables

-- Table: bricks_recibidos
create table public.bricks_recibidos (
    id uuid default uuid_generate_v4() primary key,
    set_id uuid references public.sets(id) on delete cascade not null,
    hash_visitante text not null,
    creado_en timestamptz default now(),
    unique(set_id, hash_visitante)
);

-- Table: bounties
create table public.bounties (
    id uuid default uuid_generate_v4() primary key,
    nombre_set text not null,
    tematica text not null,
    recompensa int not null default 0,
    reclamado_por uuid references public.usuarios_perfil(id) on delete set null,
    estado text default 'pendiente' check (estado in ('pendiente', 'reclamado')),
    creado_en timestamptz default now()
);

-- Table: insignias_usuario
create table public.insignias_usuario (
    id uuid default uuid_generate_v4() primary key,
    usuario_id uuid references public.usuarios_perfil(id) on delete cascade not null,
    insignia text not null,
    otorgado_en timestamptz default now(),
    unique(usuario_id, insignia)
);

-- RLS (Row Level Security)

alter table public.usuarios_perfil enable row level security;
alter table public.vitrinas enable row level security;
alter table public.sets enable row level security;
alter table public.fotos enable row level security;
alter table public.reportes enable row level security;
alter table public.bricks_recibidos enable row level security;
alter table public.bounties enable row level security;
alter table public.insignias_usuario enable row level security;

-- Policies for usuarios_perfil
create policy "Public profiles are viewable by everyone" on public.usuarios_perfil
    for select using (true);
create policy "Users can update own profile" on public.usuarios_perfil
    for update using (auth.uid() = id);

-- Policies for vitrinas
create policy "Public vitrinas are viewable by everyone" on public.vitrinas
    for select using (estado = 'publicada' and visibilidad = 'pública');
create policy "Users can view their own vitrinas" on public.vitrinas
    for select using (auth.uid() = usuario_id);
create policy "Users can insert their own vitrinas" on public.vitrinas
    for insert with check (auth.uid() = usuario_id);
create policy "Users can update their own vitrinas" on public.vitrinas
    for update using (auth.uid() = usuario_id);
create policy "Users can delete their own vitrinas" on public.vitrinas
    for delete using (auth.uid() = usuario_id);

-- Policies for sets
create policy "Public sets are viewable by everyone" on public.sets
    for select using (
        exists (
            select 1 from public.vitrinas v
            where v.id = sets.vitrina_id and v.estado = 'publicada' and v.visibilidad = 'pública'
        )
    );
create policy "Users can view their own sets" on public.sets
    for select using (auth.uid() = usuario_id);
create policy "Users can insert their own sets" on public.sets
    for insert with check (auth.uid() = usuario_id);
create policy "Users can update their own sets" on public.sets
    for update using (auth.uid() = usuario_id);
create policy "Users can delete their own sets" on public.sets
    for delete using (auth.uid() = usuario_id);

-- Policies for fotos
create policy "Public fotos are viewable by everyone" on public.fotos
    for select using (
        exists (
            select 1 from public.sets s
            join public.vitrinas v on s.vitrina_id = v.id
            where s.id = fotos.set_id and v.estado = 'publicada' and v.visibilidad = 'pública'
        )
    );
create policy "Users can view their own fotos" on public.fotos
    for select using (
        exists (
            select 1 from public.sets s
            where s.id = fotos.set_id and s.usuario_id = auth.uid()
        )
    );
create policy "Users can manage their own fotos" on public.fotos
    for all using (
        exists (
            select 1 from public.sets s
            where s.id = fotos.set_id and s.usuario_id = auth.uid()
        )
    );

-- Policies for bounties
create policy "Bounties are viewable by everyone" on public.bounties
    for select using (true);
-- (Only admins or triggers insert bounties generally)

-- Policies for insignias_usuario
create policy "Insignias are viewable by everyone" on public.insignias_usuario
    for select using (true);

-- Policies for bricks_recibidos
create policy "Bricks are viewable by everyone" on public.bricks_recibidos
    for select using (true);
create policy "Anyone can insert a brick" on public.bricks_recibidos
    for insert with check (true);
