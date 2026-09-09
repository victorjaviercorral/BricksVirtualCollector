import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BountiesPage from './page';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

vi.mock('@/components/BountiesSectionClient', () => ({
  default: ({ bounties }: { bounties: unknown[] }) => (
    <div data-testid="bounty-board">Bounties: {bounties.length}</div>
  ),
}));

describe('BountiesPage (SSR)', () => {
  beforeEach(() => vi.clearAllMocks());

  const authSinSesion = { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) };

  it('consulta solo bounties pendientes y los pasa al tablero compartido', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'b1' }, { id: 'b2' }] });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(createClient).mockResolvedValue({
      auth: authSinSesion,
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    render(await BountiesPage());

    expect(eq).toHaveBeenCalledWith('estado', 'pendiente');
    expect(screen.getByText('Bounties Comunitarios')).toBeInTheDocument();
    expect(screen.getByTestId('bounty-board')).toHaveTextContent('Bounties: 2');
  });

  it('tolera data nula', async () => {
    const order = vi.fn().mockResolvedValue({ data: null });
    vi.mocked(createClient).mockResolvedValue({
      auth: authSinSesion,
      from: vi.fn().mockReturnValue({ select: () => ({ eq: () => ({ order }) }) }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    render(await BountiesPage());
    expect(screen.getByTestId('bounty-board')).toHaveTextContent('Bounties: 0');
  });

  it('con sesión, marca los bounties ya reclamados por el usuario', async () => {
    const bountiesChain = { eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: 'b1' }, { id: 'b2' }] }) }) };
    const reclamosChain = { eq: vi.fn().mockResolvedValue({ data: [{ bounty_id: 'b2' }] }) };
    const from = vi.fn().mockImplementation((tabla: string) => {
      if (tabla === 'bounties_reclamados') return { select: () => reclamosChain };
      return { select: () => bountiesChain };
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    render(await BountiesPage());

    expect(from).toHaveBeenCalledWith('bounties_reclamados');
    expect(reclamosChain.eq).toHaveBeenCalledWith('usuario_id', 'u1');
  });
});
