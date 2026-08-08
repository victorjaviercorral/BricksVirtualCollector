import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSession } from './middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: vi.fn().mockImplementation(() => ({
        cookies: {
          set: vi.fn(),
          getAll: vi.fn(),
        }
      })),
      redirect: vi.fn().mockImplementation((url) => ({ status: 307, url })),
    },
    NextRequest: vi.fn(),
  };
});

describe('Supabase Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  const mockRequest = (pathname: string) => {
    const mockReq = {
      nextUrl: {
        pathname,
        clone: () => ({ pathname }),
      },
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as NextRequest;
    return mockReq;
  };

  it('debe permitir acceso y no redirigir si la ruta no es protegida y no hay usuario', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser }
    } as any);

    const req = mockRequest('/public-route');
    const res = await updateSession(req);

    expect(res).toBeDefined();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(mockGetUser).toHaveBeenCalled();
  });

  it('debe redirigir a /login si no hay usuario y accede a /dashboard', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser }
    } as any);

    const req = mockRequest('/dashboard/ajustes');
    await updateSession(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('debe permitir acceso si el usuario está autenticado en ruta protegida', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: '123' } } });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser }
    } as any);

    const req = mockRequest('/dashboard');
    await updateSession(req);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('debe probar setAll del middleware al configurar las cookies del response', async () => {
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser }
    } as any);

    const req = mockRequest('/public-route');
    await updateSession(req);

    const configCall = vi.mocked(createServerClient).mock.calls[0][2] as any;
    
    // Simulate setting cookies in SSR client
    configCall?.cookies?.setAll?.([{ name: 'session', value: '123', options: {} }]);
    
    expect(req.cookies.set).toHaveBeenCalledWith('session', '123');
  });
});
