import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

// S8/ADR-010 cerrado (22/09/2026): almacén compartido vía Upstash Redis (ADR-003) cuando las
// variables de entorno UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN están presentes (Vercel
// producción y preview). Sin ellas -- local sin `.env.local` configurado, o la suite de tests --
// degrada al `Map` en memoria de siempre: sigue sirviendo de mitigación, solo que no compartida
// entre instancias. Un fallo de red hacia Upstash tampoco debe tumbar la petición: se falla
// abierto (se permite) igual que la lectura de `system_config` de abajo.
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = upstashUrl && upstashToken ? new Redis({ url: upstashUrl, token: upstashToken }) : null;

// Cache en memoria: fallback cuando no hay Upstash configurado (ver arriba).
// Nota: esta caché se limpia en cada "arranque en frío" (cold boot) del Edge function.

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

async function checkRateLimitRedis(
  ip: string,
  limit: number,
  windowSec: number
): Promise<{ success: boolean; limit: number; remaining: number }> {
  try {
    // Contador de ventana fija: INCR crea la clave a 1 si no existía; solo se le pone TTL la
    // primera vez (si no, cada petición alargaría la ventana y esta nunca cerraría).
    const count = await redis!.incr(`ratelimit:${ip}`);
    if (count === 1) {
      await redis!.expire(`ratelimit:${ip}`, windowSec);
    }
    const remaining = Math.max(0, limit - count);
    return { success: count <= limit, limit, remaining };
  } catch {
    // Upstash caído o inalcanzable: fallar abierto, igual que la lectura de system_config.
    // Un proveedor de rate limiting caído nunca debe traducirse en un 429 para todo el tráfico.
    return { success: true, limit, remaining: limit - 1 };
  }
}

function checkRateLimitMemory(
  ip: string,
  limit: number,
  windowSec: number
): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();

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

export async function checkRateLimit(ip: string): Promise<{ success: boolean; limit: number; remaining: number }> {
  const { limit, windowSec } = await getRateLimitConfig();

  if (redis) {
    return checkRateLimitRedis(ip, limit, windowSec);
  }
  return checkRateLimitMemory(ip, limit, windowSec);
}
