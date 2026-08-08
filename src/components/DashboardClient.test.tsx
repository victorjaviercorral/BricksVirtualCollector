import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardClient from './DashboardClient';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock ResizeObserver for Framer Motion or similar generic things
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('DashboardClient', () => {
  const mockPush = vi.fn();
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
        signOut: vi.fn().mockResolvedValue({}),
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-vitrina-123' }, error: null }),
          })
        })
      })
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  const baseProps = {
    userProfile: { alias: 'BrickMaster', total_visitas: 10, total_bricks_recibidos: 100 },
    vitrinas: [
      { id: 'v1', nombre: 'Star Wars', visibilidad: 'pública', sets: [{ fotos: [{ url: 'http://img1.jpg' }] }] },
      { id: 'v2', nombre: 'Castle', visibilidad: 'privada', sets: null }
    ]
  };

  it('renderiza correctamente perfiles y vitrinas vacias', () => {
    render(<DashboardClient userProfile={{}} vitrinas={[]} />);
    expect(screen.getByText('Usuario Anonimo')).toBeInTheDocument();
    expect(screen.getByText('Tu museo está vacío')).toBeInTheDocument();
  });

  it('renderiza datos del usuario y vitrinas provistas', () => {
    render(<DashboardClient {...baseProps} />);
    expect(screen.getByText('BrickMaster')).toBeInTheDocument();
    expect(screen.getByText('Star Wars')).toBeInTheDocument();
    expect(screen.getByText('Castle')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // Bricks totales
    expect(screen.getByText('10')).toBeInTheDocument(); // Visitas totales
  });

  it('permite cambiar entre modo lista y grid', () => {
    render(<DashboardClient {...baseProps} />);
    
    // Al inicio está en Grid
    const starWarsTitle = screen.getByText('Star Wars');
    const container = starWarsTitle.closest('.glass');
    expect(container).toHaveClass('flex-col'); // Grid item flex-col

    // Click en Lista
    fireEvent.click(screen.getByText('Lista'));
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('h-28');
  });

  it('abre el modal y crea una vitrina', async () => {
    render(<DashboardClient {...baseProps} />);
    
    // Abrir modal
    fireEvent.click(screen.getByText('Crear Vitrina', { selector: 'button' }));
    
    // Verificar modal abierto
    expect(screen.getByText('Nueva Vitrina')).toBeInTheDocument();

    // Rellenar form
    fireEvent.change(screen.getByPlaceholderText('Ej: Star Wars UCS, Ciudad, Harry Potter...'), { target: { value: 'Nueva Vitrina Test' } });
    fireEvent.change(screen.getByPlaceholderText('Pequeña historia sobre esta vitrina...'), { target: { value: 'Descripción' } });
    
    // Enviar form
    const form = screen.getByText('Nueva Vitrina').closest('div')?.parentElement?.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('vitrinas');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/new-vitrina-123');
    });
  });

  it('falla silenciosamente o avisa de error si la creación falla', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });
    
    render(<DashboardClient {...baseProps} />);
    
    fireEvent.click(screen.getByText('Crear Vitrina', { selector: 'button' }));
    fireEvent.change(screen.getByPlaceholderText('Ej: Star Wars UCS, Ciudad, Harry Potter...'), { target: { value: 'Bad Vitrina' } });
    
    const form = screen.getByText('Nueva Vitrina').closest('div')?.parentElement?.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error al crear vitrina: DB Error');
    });
    
    alertMock.mockRestore();
  });

  it('redirecciona a login si la sesión expira al crear vitrina', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    
    render(<DashboardClient {...baseProps} />);
    
    fireEvent.click(screen.getByText('Crear Vitrina', { selector: 'button' }));
    
    const form = screen.getByText('Nueva Vitrina').closest('div')?.parentElement?.querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('permite desloguearse', async () => {
    render(<DashboardClient {...baseProps} />);
    
    const logoutBtn = screen.getByRole('button', { name: '' }).closest('.bg-brand-red\\/10');
    // We can also find it by testing the lucide icon or picking the second button in the header
    // Let's just find all buttons and get the one that calls handleLogout.
    // the easiest way is to mock it via text, but logout is just an icon.
    // Instead we can click the button that matches the logout pattern.
    const buttons = screen.getAllByRole('button');
    const logoutButton = buttons.find(b => b.className.includes('bg-brand-red/10'));
    
    fireEvent.click(logoutButton!);

    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
