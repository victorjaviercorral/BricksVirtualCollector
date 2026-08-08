import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GestionVitrina from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock MoveSetModal because it's a client component using React hooks which might fail in a pure server component render context test
vi.mock('@/components/MoveSetModal', () => ({
  default: () => <button>MoveSetModal</button>
}));

// Mock EditVitrinaModal
vi.mock('@/components/EditVitrinaModal', () => ({
  default: () => <button>EditVitrinaModal</button>
}));

describe('GestionVitrina Page (Server Component)', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'v1',
            nombre: 'Vitrina 1',
            descripcion: 'Desc',
            visibilidad: 'pública',
            sets: []
          },
          error: null
        })
      })
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('redirige si no hay usuario', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    (redirect as any).mockImplementation(() => { throw new Error('redirected'); });

    await expect(GestionVitrina({ params: Promise.resolve({ id: 'v1' }) })).rejects.toThrow('redirected');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('muestra mensaje de error si la vitrina no existe o hay error', async () => {
    mockSupabase.from().single.mockResolvedValueOnce({ data: null, error: { message: 'Not found', details: '', hint: '' } });

    const ui = await GestionVitrina({ params: Promise.resolve({ id: 'v1' }) });
    render(ui);

    expect(screen.getByText('Vitrina no encontrada')).toBeInTheDocument();
  });

  it('renderiza la vitrina vacía correctamente', async () => {
    const ui = await GestionVitrina({ params: Promise.resolve({ id: 'v1' }) });
    render(ui);

    expect(screen.getByText('Vitrina 1')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Esta vitrina está vacía')).toBeInTheDocument();
  });

  it('renderiza la vitrina con sets', async () => {
    mockSupabase.from().single.mockResolvedValueOnce({
      data: {
        id: 'v1',
        nombre: 'Vitrina 1',
        visibilidad: 'privada',
        sets: [
          { id: 's1', nombre: 'Set 1', num_piezas: 100, tematica: 'Star Wars', fotos: [{ url: 'foto1.jpg' }] },
          { id: 's2', nombre: 'Set 2', num_piezas: 50, tematica: 'City', fotos: [] }
        ]
      },
      error: null
    });

    const ui = await GestionVitrina({ params: Promise.resolve({ id: 'v1' }) });
    render(ui);

    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Star Wars', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
    expect(screen.getByText('Sin fotos')).toBeInTheDocument();
  });
});
