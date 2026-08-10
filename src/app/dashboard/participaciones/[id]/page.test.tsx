import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipacionDetailPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

vi.mock('./ParticipacionesDetailClient', () => ({
  default: ({ participacion }: any) => (
    <div data-testid="detail-client">
      <span data-testid="titulo">{participacion.titulo}</span>
      <span data-testid="recompensa">{participacion.recompensa}</span>
    </div>
  ),
}));

/**
 * NOTA DE DEUDA CONOCIDA (hallazgo R3 de docs/auditoria-arquitectura.md): cuando no se encuentra
 * el bounty reclamado, page.tsx no muestra un 404 -- devuelve datos ficticios hardcodeados
 * ("Modular Master"). Este test documenta ese comportamiento TAL COMO ES HOY para poder detectar
 * regresiones, no lo certifica como correcto. Retirar el fallback mock es tarea pendiente (ver
 * docs/05-plan/seguimiento-iteracion-2.md); cuando se resuelva, este test deberá reescribirse
 * para esperar notFound() o un estado de error real en su lugar.
 */
describe('ParticipacionDetailPage (SSR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockParams = Promise.resolve({ id: 'p1' });

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

  it('renderiza los datos reales del bounty reclamado cuando existe', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'p1', nombre_set: 'Set Raro', recompensa: 300, bounties: { descripcion: 'desc' } },
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from,
    });

    const jsx = await ParticipacionDetailPage({ params: mockParams });
    render(jsx);

    expect(from).toHaveBeenCalledWith('bounties_reclamados');
    expect(screen.getByTestId('titulo')).toHaveTextContent('Set Raro');
    expect(screen.getByTestId('recompensa')).toHaveTextContent('300');
  });

  it('cae al fallback "Modular Master" cuando el bounty no existe (deuda conocida, ver nota arriba)', async () => {
    const single = vi.fn().mockResolvedValue({ data: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from,
    });

    const jsx = await ParticipacionDetailPage({ params: mockParams });
    render(jsx);

    expect(screen.getByTestId('titulo')).toHaveTextContent('Modular Master');
    expect(screen.getByTestId('recompensa')).toHaveTextContent('500');
  });
});
