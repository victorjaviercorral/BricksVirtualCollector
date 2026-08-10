import { createClient } from "@supabase/supabase-js";

// Cache en memoria para almacenar IPs temporalmente en el Vercel Edge.
// Nota: Esta caché se limpia en cada "arranque en frío" (cold boot) del Edge function.
// Es un Rate Limit "Middle-Ground", no 100% estricto como Redis, pero suficientemente bueno
// para proteger contra ataques abusivos sin añadir dependencias externas.
//
// LIMITACIÓN CONOCIDA (hallazgo S8 de docs/auditoria-arquitectura.md): este almacén es un Map en
// memoria del proceso. En un despliegue serverless/edge con múltiples instancias, cada una tiene
// su propio contador -- no es un límite estrictamente compartido. La spec y ADR-003 decidieron
// Upstash Redis como almacén compartido; ese cambio requiere una cuenta de Upstash (decisión
// externa del titular) y queda fuera de esta iteración. Documentado en ADR-010.

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// Guardamos las IPs y su conteo
const memoryCache = new Map<string, RateLimitRecord>();

// Configuración por defecto, usada si no se puede leer system_config (Supabase caído, variables
// de entorno ausentes -- p.ej. en tests unitarios -- o fila sin crear todavía).
const DEFAULT_LIMIT = 100; // peticiones
const DEFAULT_WINDOW_SEC = 60; // 1 minuto

type RateLimitConfig = { limit: number; windowSec: number };

// Caché de la configuración leída de system_config, con TTL de 60s. El runbook interno
// (src/app/admin/system/docs/page.tsx) siempre documentó "los cambios tardan hasta 1 minuto en
// propagarse", pero hasta ahora nada leía la tabla: era una promesa sin implementar. Este TTL la
// hace real sin convertir cada petición en una consulta a Supabase.
let cachedConfig: (RateLimitConfig & { fetchedAt: number }) | null = null;
const CONFIG_CACHE_TTL_MS = 60 * 1000;

async function getRateLimitConfig(): Promise<RateLimitConfig> {
  const now = Date.now();
  if (cachedConfig && now - cachedConfig.fetchedAt < CONFIG_CACHE_TTL_MS) {
    return { limit: cachedConfig.limit, windowSec: cachedConfig.windowSec };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase env vars ausentes");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "global_rate_limit")
      .single();

    if (error || !data?.value) {
      throw error || new Error("global_rate_limit sin configurar");
    }

    const limit = Number(data.value.requests) || DEFAULT_LIMIT;
    const windowSec = Number(data.value.window_seconds) || DEFAULT_WINDOW_SEC;

    cachedConfig = { limit, windowSec, fetchedAt: now };
    return { limit, windowSec };
  } catch {
    // Degradar a los valores por defecto sin romper el rate limiting. Un fallo leyendo la
    // configuración nunca debe traducirse en peticiones sin límite.
    return { limit: DEFAULT_LIMIT, windowSec: DEFAULT_WINDOW_SEC };
  }
}

export async function checkRateLimit(ip: string): Promise<{ success: boolean; limit: number; remaining: number }> {
  const now = Date.now();
  const { limit, windowSec } = await getRateLimitConfig();

  // Limpiar caché vieja aleatoriamente (10% de las veces) para evitar memory leaks en el Edge
  if (Math.random() < 0.1) {
    for (const [key, value] of memoryCache.entries()) {
      if (now > value.resetAt) {
        memoryCache.delete(key);
      }
    }
  }

  const record = memoryCache.get(ip);

  // Si no existe, lo creamos
  if (!record) {
    memoryCache.set(ip, {
      count: 1,
      resetAt: now + (windowSec * 1000)
    });
    return { success: true, limit, remaining: limit - 1 };
  }

  // Si ya pasó el tiempo de ventana, lo reseteamos
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + (windowSec * 1000);
    return { success: true, limit, remaining: limit - 1 };
  }

  // Si aún estamos en la ventana, sumamos 1
  record.count += 1;
  const remaining = Math.max(0, limit - record.count);

  if (record.count > limit) {
    return { success: false, limit, remaining: 0 };
  }

  return { success: true, limit, remaining };
}
