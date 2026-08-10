import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditarSetClient from './EditarSetClient';
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
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('EditarSetClient', () => {
  const mockPush = vi.fn();
  let mockSupabase: any;

  const set = {
    id: 'set-1',
    nombre: 'AT-AT',
    tematica: 'Star Wars',
    num_piezas: 1267,
    estado: 'Montado',
    num_set: '75288',
    notas: 'Le falta una pata',
    vitrina_id: 'v1',
    fotos: [{ url: '/at-at.jpg' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    window.confirm = vi.fn().mockReturnValue(true);

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  it('precarga el formulario con los datos reales del set', () => {
    render(<EditarSetClient set={set} />);

    expect(screen.getByDisplayValue('AT-AT')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75288')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Le falta una pata')).toBeInTheDocument();
  });

  it('guarda los cambios llamando a update() con los valores editados y redirige a la vitrina', async () => {
    render(<EditarSetClient set={set} />);

    fireEvent.change(screen.getByDisplayValue('AT-AT'), { target: { value: 'AT-AT Actualizado' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Set actualizado correctamente'));

    expect(mockSupabase.from).toHaveBeenCalledWith('sets');
    const updateCall = mockSupabase.from.mock.results[0].value.update.mock.calls[0][0];
    expect(updateCall.nombre).toBe('AT-AT Actualizado');
    expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/v1');
  });

  it('muestra un toast de error si falla el guardado', async () => {
    mockSupabase.from.mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }) }),
    });

    render(<EditarSetClient set={set} />);
    fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al guardar los cambios'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('borra el set tras confirmar y redirige a la vitrina', async () => {
    render(<EditarSetClient set={set} />);

    fireEvent.click(screen.getByRole('button', { name: /Borrar Set/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Set eliminado'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/v1');
  });

  it('no borra nada si el usuario cancela la confirmación', () => {
    (window.confirm as any).mockReturnValue(false);
    render(<EditarSetClient set={set} />);

    fireEvent.click(screen.getByRole('button', { name: /Borrar Set/i }));

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
