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

  it('consulta solo bounties pendientes y los pasa al tablero compartido', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'b1' }, { id: 'b2' }] });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(createClient).mockResolvedValue({
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
      from: vi.fn().mockReturnValue({ select: () => ({ eq: () => ({ order }) }) }),
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    render(await BountiesPage());
    expect(screen.getByTestId('bounty-board')).toHaveTextContent('Bounties: 0');
  });
});
