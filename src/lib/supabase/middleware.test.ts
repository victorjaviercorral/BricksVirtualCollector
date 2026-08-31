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

  // --- /admin/system: isSystemRole (src/lib/roles.ts) -- antes solo 'sysadmin' por subcadena,
  // sin ningún test que ejerciera esta rama (vitest.config.ts la marcaba parcialmente cubierta).
  // Hallazgo del 19/08/2026: 'admin' se añadió porque el titular es la única persona que
  // gestiona el proyecto (mismo criterio que D2) y una cadena mal formada real
  // ("admin, sysadmin") coló por el chequeo por subcadena anterior pero fallaba en las
  // comparaciones exactas de otras partes del código -- ver migración
  // 20260819100000_validar_role_usuarios_perfil.sql.

  const mockRequestWithProfile = (pathname: string, role: string | null) => {
    const mockSingle = vi.fn().mockResolvedValue({ data: role === null ? null : { role } });
    const mockEq = vi.fn(() => ({ single: mockSingle }));
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({ select: mockSelect }));
    const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } });
    vi.mocked(createServerClient).mockReturnValue({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    } as unknown as ReturnType<typeof createServerClient>);

    return mockRequest(pathname);
  };

  it('permite acceso a /admin/system con role="sysadmin"', async () => {
    const req = mockRequestWithProfile('/admin/system/health', 'sysadmin');
    await updateSession(req);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('permite acceso a /admin/system con role="admin" (ampliado 19/08/2026)', async () => {
    const req = mockRequestWithProfile('/admin/system/health', 'admin');
    await updateSession(req);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('rechaza /admin/system con role="admin_exposiciones" (no es un rol de sistema)', async () => {
    const req = mockRequestWithProfile('/admin/system/health', 'admin_exposiciones');
    await updateSession(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('rechaza /admin/system con el valor mal formado real "admin, sysadmin"', async () => {
    const req = mockRequestWithProfile('/admin/system/health', 'admin, sysadmin');
    await updateSession(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('rechaza /admin/system si no hay perfil (sin fila en usuarios_perfil)', async () => {
    const req = mockRequestWithProfile('/admin/system/health', null);
    await updateSession(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
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
