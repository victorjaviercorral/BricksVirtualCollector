import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos el cliente regular para el health check, solo necesitamos leer si responde
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  try {
    let dbStatus = 'disconnected';
    let latency = 0;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const start = Date.now();
      // Pequeña consulta a la tabla pública profiles (o cualquier otra) para verificar conexión
      const { error } = await supabase.from('usuarios_perfil').select('id').limit(1);
      latency = Date.now() - start;

      if (!error) {
        dbStatus = 'connected';
      }
    }

    const isHealthy = dbStatus === 'connected';

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: dbStatus,
            latency_ms: latency,
          },
          api: {
            status: 'connected',
            latency_ms: 0,
          },
        },
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: String(error) },
      { status: 500 }
    );
  }
}
