import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditVitrinaModal from './EditVitrinaModal';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('EditVitrinaModal', () => {
  const mockRefresh = vi.fn();
  let mockSupabase: any;
  const mockVitrina = {
    id: 'v123',
    nombre: 'Star Wars',
    descripcion: 'Colección UCS',
    visibilidad: 'pública'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ refresh: mockRefresh });
    
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  it('renderiza el boton y abre el modal', () => {
    render(<EditVitrinaModal vitrina={mockVitrina} />);
    
    const btn = screen.getByText('Editar Vitrina', { selector: 'button' });
    fireEvent.click(btn);

    expect(screen.getByDisplayValue('Star Wars')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Colección UCS')).toBeInTheDocument();
  });

  it('permite modificar campos y guardar los cambios', async () => {
    render(<EditVitrinaModal vitrina={mockVitrina} />);
    
    fireEvent.click(screen.getByText('Editar Vitrina', { selector: 'button' }));
    
    const nombreInput = screen.getByDisplayValue('Star Wars');
    fireEvent.change(nombreInput, { target: { value: 'Star Wars Updated' } });

    const visibilidadPrivada = screen.getByText('Privada', { selector: 'strong' }).closest('button');
    fireEvent.click(visibilidadPrivada!);

    const form = screen.getByText('Guardar Cambios').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('vitrinas');
      expect(toast.success).toHaveBeenCalledWith('Vitrina actualizada correctamente');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('muestra error si falla la actualizacion', async () => {
    mockSupabase.from().update().eq.mockResolvedValueOnce({ error: { message: 'DB fail' } });
    
    render(<EditVitrinaModal vitrina={mockVitrina} />);
    
    fireEvent.click(screen.getByText('Editar Vitrina', { selector: 'button' }));
    
    const form = screen.getByText('Guardar Cambios').closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al actualizar la vitrina');
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
