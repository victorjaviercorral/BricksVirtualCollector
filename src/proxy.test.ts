import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from './proxy';
import { checkRateLimit } from '@/lib/rate-limit';
import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}));

function mockRequest(pathname: string, headers: Record<string, string> = {}): NextRequest {
  return {
    nextUrl: { pathname },
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
  } as unknown as NextRequest;
}

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (updateSession as any).mockResolvedValue({ marker: 'session-response' });
  });

  it('aplica rate limiting a rutas de app/API (sin punto en el path)', async () => {
    (checkRateLimit as any).mockResolvedValue({ success: true, limit: 100, remaining: 99 });

    const req = mockRequest('/dashboard');
    await proxy(req);

    expect(checkRateLimit).toHaveBeenCalledWith('anonymous');
  });

  it('NO aplica rate limiting a rutas de assets estáticos (con extensión en el path)', async () => {
    const req = mockRequest('/logo.jpg');
    await proxy(req);

    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(updateSession).toHaveBeenCalledWith(req);
  });

  it('usa x-real-ip cuando está presente', async () => {
    (checkRateLimit as any).mockResolvedValue({ success: true, limit: 100, remaining: 99 });

    const req = mockRequest('/dashboard', { 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' });
    await proxy(req);

    expect(checkRateLimit).toHaveBeenCalledWith('1.1.1.1');
  });

  it('recurre a x-forwarded-for si no hay x-real-ip', async () => {
    (checkRateLimit as any).mockResolvedValue({ success: true, limit: 100, remaining: 99 });

    const req = mockRequest('/dashboard', { 'x-forwarded-for': '3.3.3.3' });
    await proxy(req);

    expect(checkRateLimit).toHaveBeenCalledWith('3.3.3.3');
  });

  it('bloquea con 429 y las cabeceras de rate limit cuando se excede el límite', async () => {
    (checkRateLimit as any).mockResolvedValue({ success: false, limit: 50, remaining: 0 });

    const req = mockRequest('/api/bricks');
    const res = await proxy(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('50');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('Content-Type')).toBe('application/json');
    const body = await res.json();
    expect(body).toEqual({ error: 'Too Many Requests', message: 'Has excedido el límite de peticiones.' });
    // No debe llegar a resolver sesión si la petición se bloquea por rate limit.
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('delega en updateSession (sesión/autenticación) cuando el rate limit permite la petición', async () => {
    (checkRateLimit as any).mockResolvedValue({ success: true, limit: 100, remaining: 99 });

    const req = mockRequest('/admin/moderacion');
    const res = await proxy(req);

    expect(updateSession).toHaveBeenCalledWith(req);
    expect(res).toEqual({ marker: 'session-response' });
  });
});
