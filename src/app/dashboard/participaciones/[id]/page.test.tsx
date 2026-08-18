import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipacionDetailPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
  notFound: vi.fn().mockImplementation(() => { throw new Error('notFound') }),
}));

vi.mock('./ParticipacionesDetailClient', () => ({
  default: ({ participacion }: any) => (
    <div data-testid="detail-client">
      <span data-testid="nombreSet">{participacion.nombreSet}</span>
      <span data-testid="recompensa">{participacion.recompensa}</span>
      <span data-testid="tematica">{participacion.tematica}</span>
    </div>
  ),
}));

/**
 * Hallazgo R3 cerrado (Iteración 4): antes, cuando no se encontraba el reclamo, esta página
 * mostraba un "Modular Master" ficticio en vez de un 404 -- posible porque, hasta que
 * api/bounties/claim/route.ts empezó a escribir de verdad en bounties_reclamados (D1), ningún
 * flujo real poblaba esa tabla (hallazgo N8). Ahora un id que no existe (o que no pertenece al
 * usuario -- ver el filtro por usuario_id) es un 404 real.
 */
describe('ParticipacionDetailPage (SSR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams = Promise.resolve({ id: 'r1' });

  const buildSupabase = (singleResult: any) => {
    const single = vi.fn().mockResolvedValue(singleResult);
    const eq2 = vi.fn().mockReturnValue({ single });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const select = vi.fn().mockReturnValue({ eq: eq1 });
    const from = vi.fn().mockReturnValue({ select });
    return {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from,
      __eq1: eq1,
      __eq2: eq2,
    };
  };

  it('redirecciona a login si no hay usuario', async () => {
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    try {
      await ParticipacionDetailPage({ params: mockParams });
    } catch (e: any) {
      expect(e.message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza los datos reales del reclamo cuando existe, incluida la temática del bounty', async () => {
    const supabase = buildSupabase({
      data: {
        id: 'r1',
        nombre_set: 'Halcón Milenario UCS',
        recompensa: 500,
        estado: 'reclamado',
        creado_en: '2026-08-18T10:00:00.000Z',
        bounties: { tematica: 'Star Wars' },
        sets: { id: 's1', nombre: 'Mi Halcón' },
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const jsx = await ParticipacionDetailPage({ params: mockParams });
    render(jsx);

    expect(supabase.from).toHaveBeenCalledWith('bounties_reclamados');
    // Filtra explícitamente por id Y por usuario_id (cinturón y tirantes sobre la RLS).
    expect(supabase.__eq1).toHaveBeenCalledWith('id', 'r1');
    expect(supabase.__eq2).toHaveBeenCalledWith('usuario_id', 'u1');

    expect(screen.getByTestId('nombreSet')).toHaveTextContent('Halcón Milenario UCS');
    expect(screen.getByTestId('recompensa')).toHaveTextContent('500');
    expect(screen.getByTestId('tematica')).toHaveTextContent('Star Wars');
  });

  it('resuelve la relación con bounties/sets aunque el cliente la infiera como array', async () => {
    const supabase = buildSupabase({
      data: {
        id: 'r1',
        nombre_set: 'Set X',
        recompensa: 200,
        estado: 'reclamado',
        creado_en: '2026-08-18T10:00:00.000Z',
        bounties: [{ tematica: 'Icons' }],
        sets: [{ id: 's2', nombre: 'Mi Set X' }],
      },
    });
    (createClient as any).mockResolvedValue(supabase);

    const jsx = await ParticipacionDetailPage({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('tematica')).toHaveTextContent('Icons');
  });

  it('devuelve 404 real cuando el reclamo no existe o no pertenece al usuario', async () => {
    const supabase = buildSupabase({ data: null });
    (createClient as any).mockResolvedValue(supabase);

    try {
      await ParticipacionDetailPage({ params: mockParams });
    } catch (e: any) {
      expect(e.message).toBe('notFound');
    }

    expect(notFound).toHaveBeenCalled();
  });
});
