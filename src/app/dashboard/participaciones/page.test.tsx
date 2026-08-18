import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipacionesPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

// Mock ParticipacionesClient
vi.mock('./ParticipacionesClient', () => ({
  default: ({ misExposiciones }: any) => <div data-testid="participaciones-client">Mis Expos: {misExposiciones.length}</div>
}));

describe('ParticipacionesPage (SSR)', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
      },
      from: vi.fn().mockImplementation((table) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [{ id: '1' }] })
        };
      })
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('redirecciona a login si no hay usuario', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

    try {
      await ParticipacionesPage();
    } catch (e: any) {
      expect(e.message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza y pasa datos al cliente', async () => {
    // Mock the chained calls dynamically based on `from` usage
    mockSupabase.from.mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ id: `mock-${table}` }] })
      };
      // Need to resolve properly since there are await chains
      if (table === 'sets') {
        builder.eq = vi.fn().mockResolvedValue({ data: [{ id: 'set1' }] });
      }
      if (table === 'exposicion_sets' || table === 'bounties' || table === 'bounties_reclamados' || table === 'sets_insignias' || table === 'exposiciones_temporales') {
        // all end with a resolver like in, eq, limit
        builder.in = vi.fn().mockResolvedValue({ data: [{ id: '1' }] });
        builder.eq = vi.fn().mockReturnThis();
        builder.limit = vi.fn().mockResolvedValue({ data: [{ id: '2' }] });
      }
      // bounties_reclamados: cadena .select().eq('usuario_id', ...).order(...) (modelo
      // multi-reclamo, D1 -- ver src/app/dashboard/participaciones/page.tsx)
      if (table === 'bounties_reclamados') {
        builder.order = vi.fn().mockResolvedValue({ data: [] });
      }
      // For exposiciones_temporales
      if (table === 'exposiciones_temporales') {
         builder.eq = vi.fn().mockResolvedValue({ data: [] });
      }
      return builder;
    });

    const jsx = await ParticipacionesPage();
    render(jsx);

    expect(screen.getByTestId('participaciones-client')).toBeInTheDocument();
  });

  it('maneja el caso de arrays nulos correctamente (userSets == null)', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null }) // default null
      };
      if (table === 'sets') {
        builder.eq = vi.fn().mockResolvedValue({ data: null }); // triggers || []
      }
      if (table === 'exposicion_sets' || table === 'bounties' || table === 'bounties_reclamados' || table === 'sets_insignias' || table === 'exposiciones_temporales') {
        builder.in = vi.fn().mockResolvedValue({ data: null });
        builder.eq = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: null }), limit: vi.fn().mockResolvedValue({ data: null }) });
        builder.limit = vi.fn().mockResolvedValue({ data: null });
      }
      if (table === 'bounties' || table === 'bounties_reclamados') {
        builder.eq = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null }),
          limit: vi.fn().mockResolvedValue({ data: null })
        });
      }
      if (table === 'exposiciones_temporales') {
        builder.eq = vi.fn().mockResolvedValue({ data: null });
      }
      return builder;
    });

    const jsx = await ParticipacionesPage();
    render(jsx);

    // Default mock client says Mis Expos: 0 because validExposiciones is []
    expect(screen.getByText('Mis Expos: 0')).toBeInTheDocument();
  });
});
