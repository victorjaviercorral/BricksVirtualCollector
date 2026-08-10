import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('GET /auth/confirm', () => {
  const BASE = 'https://app.example.com/auth/confirm';
  let mockExchangeCodeForSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExchangeCodeForSession = vi.fn();
    (createClient as any).mockResolvedValue({
      auth: { exchangeCodeForSession: mockExchangeCodeForSession },
    });
  });

  it('redirige a /dashboard tras un código válido sin next', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(new NextRequest(`${BASE}?code=abc123`));

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('abc123');
    expect(res.headers.get('location')).toBe('https://app.example.com/dashboard');
  });

  it('redirige a la ruta interna indicada en next cuando es válida', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(new NextRequest(`${BASE}?code=abc123&next=/mesa-de-trabajo`));

    expect(res.headers.get('location')).toBe('https://app.example.com/mesa-de-trabajo');
  });

  it('redirige a /login?error=InvalidToken si exchangeCodeForSession falla', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid code' } });

    const res = await GET(new NextRequest(`${BASE}?code=badcode`));

    expect(res.headers.get('location')).toBe('https://app.example.com/login?error=InvalidToken');
  });

  it('redirige a /login?error=InvalidToken si no hay código en la URL', async () => {
    const res = await GET(new NextRequest(BASE));

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe('https://app.example.com/login?error=InvalidToken');
  });

  // --- Regresión del hallazgo S4 (open redirect) ---

  it('rechaza next="//evil.com" (protocol-relative) y cae al fallback /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(new NextRequest(`${BASE}?code=abc123&next=//evil.com`));

    const location = res.headers.get('location')!;
    expect(new URL(location).hostname).toBe('app.example.com');
    expect(location).toBe('https://app.example.com/dashboard');
  });

  it('rechaza next con contrabarra ("/\\\\evil.com") y cae al fallback /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(new NextRequest(`${BASE}?code=abc123&next=${encodeURIComponent('/\\evil.com')}`));

    const location = res.headers.get('location')!;
    expect(new URL(location).hostname).toBe('app.example.com');
  });

  it('rechaza next="https://evil.com" (URL absoluta) y cae al fallback /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(new NextRequest(`${BASE}?code=abc123&next=${encodeURIComponent('https://evil.com')}`));

    const location = res.headers.get('location')!;
    expect(new URL(location).hostname).toBe('app.example.com');
    expect(location).toBe('https://app.example.com/dashboard');
  });
});
