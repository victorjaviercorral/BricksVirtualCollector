import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

// Mock del cliente de componente para evitar problemas de animaciones e interactividad en pruebas unitarias de SSR
vi.mock('@/components/DashboardClient', () => ({
  default: ({ userProfile, vitrinas }: any) => (
    <div data-testid="dashboard-client">
      <span data-testid="profile-alias">{userProfile.alias}</span>
      <span data-testid="total-bricks">{userProfile.total_bricks_recibidos}</span>
      <span data-testid="vitrinas-count">{vitrinas.length}</span>
    </div>
  )
}));

describe('Dashboard Page (SSR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirecciona a login si no hay usuario', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    try {
      await Dashboard();
    } catch (e: any) {
      expect(e.message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza DashboardClient con perfil y vitrinas vacias si no hay datos', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from: vi.fn().mockImplementation((table) => {
        if (table === 'usuarios_perfil') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { alias: 'TestUser' } }),
          };
        }
        if (table === 'vitrinas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: null }), // vitrinas null
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    const jsx = await Dashboard();
    render(jsx);

    expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
    expect(screen.getByTestId('profile-alias')).toHaveTextContent('TestUser');
    expect(screen.getByTestId('vitrinas-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total-bricks')).toHaveTextContent('0');
  });

  it('calcula totalBricks correctamente si hay vitrinas con sets', async () => {
    const mockSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from: vi.fn().mockImplementation((table) => {
        if (table === 'usuarios_perfil') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { alias: 'BrickFan' } }),
          };
        }
        if (table === 'vitrinas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [
              { id: 'v1', sets: [{ id: 'set1' }, { id: 'set2' }] },
              { id: 'v2', sets: null }
            ] }),
          };
        }
        if (table === 'bricks_recibidos') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 42 }), // total de bricks devuelto en cabecera
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    const jsx = await Dashboard();
    render(jsx);

    expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
    expect(screen.getByTestId('vitrinas-count')).toHaveTextContent('2');
    expect(screen.getByTestId('total-bricks')).toHaveTextContent('42');
  });
});
