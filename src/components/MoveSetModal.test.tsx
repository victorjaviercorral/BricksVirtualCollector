import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MoveSetModal from './MoveSetModal';
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

describe('MoveSetModal', () => {
  const mockRefresh = vi.fn();
  let mockSupabase: any;
  const mockSet = {
    id: 'set1',
    nombre: 'Castle',
    vitrina_id: 'v1'
  };
  const mockVitrinas = [
    { id: 'v1', nombre: 'Vitrina Origen', visibilidad: 'privada' },
    { id: 'v2', nombre: 'Vitrina Destino', visibilidad: 'pública' }
  ];

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

  it('abre el modal y muestra las vitrinas, indicando la actual', () => {
    render(<MoveSetModal set={mockSet} vitrinas={mockVitrinas} />);
    
    const btn = screen.getByTitle('Mover a otra vitrina');
    fireEvent.click(btn);

    expect(screen.getByText('Vitrina Origen')).toBeInTheDocument();
    expect(screen.getByText('Vitrina Destino')).toBeInTheDocument();
    expect(screen.getByText('Vitrina actual')).toBeInTheDocument(); // En Vitrina Origen
  });

  it('no permite guardar si la vitrina destino es igual a la actual', async () => {
    render(<MoveSetModal set={mockSet} vitrinas={mockVitrinas} />);
    fireEvent.click(screen.getByTitle('Mover a otra vitrina'));
    
    const form = screen.getByRole('button', { name: 'Mover Set' }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Selecciona una vitrina diferente');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  it('permite mover a otra vitrina y guardar', async () => {
    render(<MoveSetModal set={mockSet} vitrinas={mockVitrinas} />);
    fireEvent.click(screen.getByTitle('Mover a otra vitrina'));
    
    // Seleccionar otra vitrina (Destino)
    const btnDestino = screen.getByText('Vitrina Destino').closest('button');
    fireEvent.click(btnDestino!);

    const form = screen.getByRole('button', { name: 'Mover Set' }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('sets');
      expect(mockRefresh).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Set movido correctamente');
    });
  });

  it('muestra un error si falla el guardado', async () => {
    mockSupabase.from().update().eq.mockResolvedValueOnce({ error: { message: 'Failed' } });

    render(<MoveSetModal set={mockSet} vitrinas={mockVitrinas} />);
    fireEvent.click(screen.getByTitle('Mover a otra vitrina'));
    
    // Seleccionar otra vitrina (Destino)
    const btnDestino = screen.getByText('Vitrina Destino').closest('button');
    fireEvent.click(btnDestino!);

    const form = screen.getByRole('button', { name: 'Mover Set' }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al mover el set');
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
