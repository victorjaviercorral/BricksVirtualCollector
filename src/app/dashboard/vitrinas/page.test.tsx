import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MisVitrinasDashboardPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

vi.mock('@/components/MisVitrinasClient', () => ({
  MisVitrinasClient: ({ vitrinas }: any) => (
    <div data-testid="mis-vitrinas-client">{vitrinas.length}</div>
  ),
}));

describe('MisVitrinasDashboardPage (SSR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirecciona a login si no hay usuario', async () => {
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    try {
      await MisVitrinasDashboardPage();
    } catch (e: any) {
      expect(e.message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza MisVitrinasClient con las vitrinas del usuario ordenadas por creado_en', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'v1' }, { id: 'v2' }] });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from,
    });

    const jsx = await MisVitrinasDashboardPage();
    render(jsx);

    expect(from).toHaveBeenCalledWith('vitrinas');
    expect(eq).toHaveBeenCalledWith('usuario_id', 'user1');
    expect(order).toHaveBeenCalledWith('creado_en', { ascending: false });
    expect(screen.getByTestId('mis-vitrinas-client')).toHaveTextContent('2');
  });

  it('pasa un array vacío si la consulta no devuelve vitrinas', async () => {
    const order = vi.fn().mockResolvedValue({ data: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from,
    });

    const jsx = await MisVitrinasDashboardPage();
    render(jsx);

    expect(screen.getByTestId('mis-vitrinas-client')).toHaveTextContent('0');
  });
});
