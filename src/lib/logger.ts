import { createClient } from '@supabase/supabase-js';

// Usamos el Service Role Key para poder insertar en system_logs saltándonos RLS.
// Esto es seguro porque logger.ts solo se ejecutará en entorno de Servidor (Server Components, API Routes, Actions).
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) return null;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

type LogLevel = 'info' | 'warning' | 'error' | 'fatal';

interface LogPayload {
  level: LogLevel;
  message: string;
  endpoint?: string;
  userId?: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

/**
 * Registra un evento en la tabla `system_logs`.
 * Esta función es asíncrona "fire and forget" para no bloquear la ejecución principal.
 */
export const systemLogger = {
  log: async (payload: LogPayload) => {
    // Si estamos en desarrollo, también imprimimos en la consola de Vercel/Terminal
    if (process.env.NODE_ENV === 'development') {
      const color = payload.level === 'error' || payload.level === 'fatal' ? '\x1b[31m' : 
                    payload.level === 'warning' ? '\x1b[33m' : '\x1b[36m';
      console.log(`${color}[${payload.level.toUpperCase()}]\x1b[0m ${payload.message}`);
    }

    try {
      // Inserción asíncrona en Supabase
      // Importante: No hacemos await para no bloquear la petición del usuario
      const supabase = getSupabaseAdmin();
      if (supabase) {
        supabase.from('system_logs').insert({
        level: payload.level,
        message: payload.message,
        endpoint: payload.endpoint,
        user_id: payload.userId || null,
        context: payload.context || {},
        stack_trace: payload.stackTrace,
      }).then(({ error }) => {
        if (error) {
          console.error('Failed to write to system_logs:', error);
        }
      });
      } // Fin de if (supabase)
    } catch (err) {
      console.error('Logger failed critically:', err);
    }
  },

  info: (message: string, context?: Omit<LogPayload, 'level' | 'message'>) => 
    systemLogger.log({ level: 'info', message, ...context }),
    
  warning: (message: string, context?: Omit<LogPayload, 'level' | 'message'>) => 
    systemLogger.log({ level: 'warning', message, ...context }),
    
  error: (message: string, context?: Omit<LogPayload, 'level' | 'message'>) => 
    systemLogger.log({ level: 'error', message, ...context }),
    
  fatal: (message: string, context?: Omit<LogPayload, 'level' | 'message'>) => 
    systemLogger.log({ level: 'fatal', message, ...context }),
};
