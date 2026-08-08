import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModeracionPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Moderacion Page', () => {
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: mockGetUser },
      from: mockFrom
    } as any);

    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle, order: mockOrder });
    mockOrder.mockResolvedValue({ data: [] });
  });

  it('debe redirigir a /login si no hay usuario', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    
    try {
      await ModeracionPage();
    } catch(e) {}

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('debe redirigir a / si no es admin o admin_exposiciones', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'user' } });
    
    try {
      await ModeracionPage();
    } catch(e) {}

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('debe renderizar estado vacío si no hay pendientes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'admin' } });
    mockOrder.mockResolvedValue({ data: [] });
    
    const ui = await ModeracionPage();
    render(ui as React.ReactElement);

    expect(screen.getByText('Todo al día')).toBeInTheDocument();
  });

  it('debe renderizar la lista de pendientes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    mockSingle.mockResolvedValue({ data: { role: 'admin' } });
    mockOrder.mockResolvedValue({ 
      data: [{
        id: 'req-1',
        sets: {
          nombre: 'Halcón Milenario',
          fotos: [{ url: 'http://img.com/a.jpg' }],
          usuarios_perfil: { alias: 'Luke' }
        },
        exposiciones_temporales: { titulo: 'Star Wars Week' }
      }, {
        id: 'req-2',
        sets: {
          nombre: 'X-Wing',
          fotos: [],
          usuarios_perfil: null
        },
        exposiciones_temporales: { titulo: 'Star Wars Week' }
      }] 
    });
    
    const ui = await ModeracionPage();
    render(ui as React.ReactElement);

    expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    expect(screen.getByText('Enviado por: Luke')).toBeInTheDocument();
    expect(screen.getByText('X-Wing')).toBeInTheDocument();
    expect(screen.getByText('Enviado por: Anónimo')).toBeInTheDocument();
    expect(screen.getByText('Sin foto')).toBeInTheDocument();
  });
});
