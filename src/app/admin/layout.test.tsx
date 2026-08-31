import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminLayout from './layout';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock dependencias
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Dummy component render
vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => <a href={href} className={className} data-testid="mock-link">{children}</a>
}));

describe('Admin Layout', () => {
  const mockPush = vi.fn();
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(usePathname).mockReturnValue('/admin');
    
    vi.mocked(createClient).mockReturnValue({
      auth: { getUser: mockGetUser },
      from: mockFrom
    } as any);

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('debe mostrar mensaje de carga inicialmente', () => {
    // Retrasar la promesa para ver el estado inicial
    mockGetUser.mockReturnValue(new Promise(() => {}));
    
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Verificando credenciales...')).toBeInTheDocument();
  });

  it('debe redirigir a /login si no hay usuario logueado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('debe redirigir a /dashboard si el rol es usuario normal', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'user' } });
    
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('debe renderizar contenido si es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'admin' } });
    
    render(
      <AdminLayout>
        <div data-testid="child-content">Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    // Antes esta expectativa era "y no debe mostrar el link System" -- correcta cuando existía
    // separación de roles, incorrecta desde el 19/08/2026: 'admin' ahora SÍ ve System (ver
    // isSystemRole, src/lib/roles.ts, y el test dedicado "debe mostrar el link de System si es
    // admin" más abajo, que cubre este caso explícitamente).
  });

  it('debe mostrar el link de System si es sysadmin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'sys-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'sysadmin' } });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  // Ampliado 19/08/2026: antes solo "sysadmin" veía el link. El titular gestiona el proyecto en
  // solitario (mismo criterio que D2) y un valor mal formado real ("admin, sysadmin") coló por
  // el chequeo anterior por subcadena pero fallaba en comparaciones exactas -- ver
  // src/lib/roles.ts (isSystemRole) y la migración 20260819100000.
  it('debe mostrar el link de System si es admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'admin' } });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  it('NO debe mostrar el link de System si es admin_exposiciones (no es un rol de sistema)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'expo-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'admin_exposiciones' } });

    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Exposiciones')).toBeInTheDocument(); // confirma que ya cargó
    });
    expect(screen.queryByText('System')).not.toBeInTheDocument();
  });


  it('aplica clase activa al link basado en el pathname', async () => {
    vi.mocked(usePathname).mockReturnValue('/admin/bounties');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'admin' } });
    
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      const link = screen.getByText('Bounties').closest('a');
      expect(link?.className).toContain('bg-brand-yellow');
    });
  });

  it('aplica clase activa al link de system cuando se está en /admin/system', async () => {
    vi.mocked(usePathname).mockReturnValue('/admin/system/health');
    mockGetUser.mockResolvedValue({ data: { user: { id: 'sys-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'sysadmin' } });
    
    render(
      <AdminLayout>
        <div>Content</div>
      </AdminLayout>
    );

    await waitFor(() => {
      const link = screen.getByText('System').closest('a');
      expect(link?.className).toContain('bg-brand-yellow');
    });
  });
});
