// Cache en memoria para almacenar IPs temporalmente en el Vercel Edge.
// Nota: Esta caché se limpia en cada "arranque en frío" (cold boot) del Edge function.
// Es un Rate Limit "Middle-Ground", no 100% estricto como Redis, pero suficientemente bueno
// para proteger contra ataques abusivos sin añadir dependencias externas.

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// Guardamos las IPs y su conteo
const memoryCache = new Map<string, RateLimitRecord>();

// Configuración por defecto (puede ser sobreescrita si la leemos de Supabase)
const DEFAULT_LIMIT = 100; // peticiones
const DEFAULT_WINDOW_SEC = 60; // 1 minuto

export async function checkRateLimit(ip: string): Promise<{ success: boolean; limit: number; remaining: number }> {
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
      resetAt: now + (DEFAULT_WINDOW_SEC * 1000)
    });
    return { success: true, limit: DEFAULT_LIMIT, remaining: DEFAULT_LIMIT - 1 };
  }

  // Si ya pasó el tiempo de ventana, lo reseteamos
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + (DEFAULT_WINDOW_SEC * 1000);
    return { success: true, limit: DEFAULT_LIMIT, remaining: DEFAULT_LIMIT - 1 };
  }

  // Si aún estamos en la ventana, sumamos 1
  record.count += 1;
  const remaining = Math.max(0, DEFAULT_LIMIT - record.count);

  if (record.count > DEFAULT_LIMIT) {
    return { success: false, limit: DEFAULT_LIMIT, remaining: 0 };
  }

  return { success: true, limit: DEFAULT_LIMIT, remaining };
}
