import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * rate-limit.ts mantiene estado en variables de módulo (memoryCache, cachedConfig), que persiste
 * entre imports dentro del mismo proceso de Vitest. Cada test usa `vi.resetModules()` + un import
 * dinámico para obtener una instancia limpia y evitar que un test contamine el estado del
 * siguiente -- es la razón por la que no hay un `import { checkRateLimit } from './rate-limit'`
 * estático en la cabecera de este fichero.
 */

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockCreateClient = vi.fn(() => ({ from: mockFrom }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => (mockCreateClient as (...a: any[]) => any)(...args),
}));

const mockIncr = vi.fn();
const mockExpire = vi.fn();
const mockRedisConstructor = vi.fn();

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(...args: unknown[]) {
      mockRedisConstructor(...args);
    }
    incr(...args: unknown[]) {
      return mockIncr(...args);
    }
    expire(...args: unknown[]) {
      return mockExpire(...args);
    }
  },
}));

async function freshCheckRateLimit() {
  vi.resetModules();
  const mod = await import('./rate-limit');
  return mod.checkRateLimit;
}

describe('checkRateLimit', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
    // Estos tests ejercen el fallback en memoria: sin Upstash configurado, sea cual sea el
    // entorno real de quien ejecute la suite.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('permite la primera petición de una IP nueva y descuenta del límite configurado', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 5, window_seconds: 60 } }, error: null });
    const checkRateLimit = await freshCheckRateLimit();

    const result = await checkRateLimit('1.2.3.4');

    expect(result).toEqual({ success: true, limit: 5, remaining: 4 });
    expect(mockFrom).toHaveBeenCalledWith('system_config');
    expect(mockEq).toHaveBeenCalledWith('key', 'global_rate_limit');
  });

  it('bloquea una IP que supera el límite configurado dentro de la ventana', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 2, window_seconds: 60 } }, error: null });
    const checkRateLimit = await freshCheckRateLimit();

    await checkRateLimit('5.5.5.5'); // count=1
    await checkRateLimit('5.5.5.5'); // count=2, todavía dentro del límite
    const third = await checkRateLimit('5.5.5.5'); // count=3, excede

    expect(third).toEqual({ success: false, limit: 2, remaining: 0 });
  });

  it('IPs distintas mantienen contadores independientes', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 1, window_seconds: 60 } }, error: null });
    const checkRateLimit = await freshCheckRateLimit();

    const a = await checkRateLimit('10.0.0.1');
    const b = await checkRateLimit('10.0.0.2');

    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });

  it('degrada al límite por defecto (100/60s) si Supabase responde con error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'db down' } });
    const checkRateLimit = await freshCheckRateLimit();

    const result = await checkRateLimit('9.9.9.9');

    expect(result).toEqual({ success: true, limit: 100, remaining: 99 });
  });

  it('degrada al límite por defecto si faltan las variables de entorno de Supabase', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const checkRateLimit = await freshCheckRateLimit();

    const result = await checkRateLimit('8.8.8.8');

    expect(result).toEqual({ success: true, limit: 100, remaining: 99 });
    // Nunca debe haber intentado construir un cliente sin credenciales.
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('cachea la configuración leída de system_config: una segunda petición no repite la consulta', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 10, window_seconds: 60 } }, error: null });
    const checkRateLimit = await freshCheckRateLimit();

    await checkRateLimit('7.7.7.7');
    await checkRateLimit('7.7.7.7');

    // Dos peticiones, una sola lectura a system_config: la segunda debe servirse desde caché.
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

describe('checkRateLimit — almacén compartido con Upstash Redis (S8/ADR-010, E2 del preflight)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      UPSTASH_REDIS_REST_URL: 'https://fake-upstash.example.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'fake-token',
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('construye el cliente de Upstash con la URL y el token de las variables de entorno', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 5, window_seconds: 60 } }, error: null });
    mockIncr.mockResolvedValue(1);
    const checkRateLimit = await freshCheckRateLimit();

    await checkRateLimit('1.2.3.4');

    expect(mockRedisConstructor).toHaveBeenCalledWith({
      url: 'https://fake-upstash.example.upstash.io',
      token: 'fake-token',
    });
  });

  it('permite la primera petición de una IP e incrementa el contador compartido con TTL', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 5, window_seconds: 60 } }, error: null });
    mockIncr.mockResolvedValue(1);
    const checkRateLimit = await freshCheckRateLimit();

    const result = await checkRateLimit('1.2.3.4');

    expect(result).toEqual({ success: true, limit: 5, remaining: 4 });
    expect(mockIncr).toHaveBeenCalledWith('ratelimit:1.2.3.4');
    // Solo se fija el TTL cuando la clave se crea (count === 1), para no alargar la ventana.
    expect(mockExpire).toHaveBeenCalledWith('ratelimit:1.2.3.4', 60);
  });

  it('no reinicia el TTL en peticiones siguientes dentro de la misma ventana', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 5, window_seconds: 60 } }, error: null });
    mockIncr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const checkRateLimit = await freshCheckRateLimit();

    await checkRateLimit('1.2.3.4');
    const second = await checkRateLimit('1.2.3.4');

    expect(second).toEqual({ success: true, limit: 5, remaining: 3 });
    expect(mockExpire).toHaveBeenCalledTimes(1);
  });

  it('bloquea cuando el contador compartido supera el límite configurado', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 2, window_seconds: 60 } }, error: null });
    mockIncr.mockResolvedValue(3);
    const checkRateLimit = await freshCheckRateLimit();

    const result = await checkRateLimit('5.5.5.5');

    expect(result).toEqual({ success: false, limit: 2, remaining: 0 });
  });

  it('falla abierto si Upstash no responde, sin tumbar la petición', async () => {
    mockSingle.mockResolvedValue({ data: { value: { requests: 5, window_seconds: 60 } }, error: null });
    mockIncr.mockRejectedValue(new Error('upstash inalcanzable'));
    const checkRateLimit = await freshCheckRateLimit();

    const result = await checkRateLimit('9.9.9.9');

    expect(result).toEqual({ success: true, limit: 5, remaining: 4 });
  });
});
