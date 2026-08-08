-- Crear tabla de logs del sistema
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'fatal')),
    message TEXT NOT NULL,
    endpoint TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    context JSONB DEFAULT '{}'::jsonb,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Solo los sysadmins pueden ver los logs
CREATE POLICY "Sysadmins can view system logs" 
ON system_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM usuarios_perfil 
        WHERE usuarios_perfil.id = auth.uid() 
        AND usuarios_perfil.role LIKE '%sysadmin%'
    )
);

-- Solo service_role puede insertar logs directamente (desde el backend de Next.js)
-- Los inserts desde el Edge o el Backend usarán el cliente de Supabase con service_role key
-- O alternativamente, permitimos insert a authenticated si se hace desde el cliente,
-- pero por seguridad, los logs estructurados deberían venir del backend.

-- Crear tabla de configuración del sistema (Rate Limits, etc)
CREATE TABLE system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configuración inicial por defecto (ej. rate limit general)
INSERT INTO system_config (key, value, description)
VALUES ('global_rate_limit', '{"requests": 100, "window_seconds": 60}'::jsonb, 'Límite global de peticiones por minuto por IP para rutas no autenticadas');

-- Habilitar RLS en system_config
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Cualquiera (incluido anon) puede leer la configuración de rate limit desde el middleware
CREATE POLICY "Public read access to system_config" 
ON system_config FOR SELECT 
USING (true);

-- Solo sysadmins pueden actualizar la configuración
CREATE POLICY "Sysadmins can update system_config" 
ON system_config FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM usuarios_perfil 
        WHERE usuarios_perfil.id = auth.uid() 
        AND usuarios_perfil.role LIKE '%sysadmin%'
    )
);
