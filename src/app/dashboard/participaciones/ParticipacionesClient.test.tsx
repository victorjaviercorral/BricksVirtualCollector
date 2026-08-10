import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParticipacionesClient from './ParticipacionesClient';
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
  },
}));

/**
 * Reescrito por completo. La versión anterior de este test cubría una UI de pestañas
 * (exposiciones/bounties/insignias) con historial visual que ya no existe: el componente fue
 * rediseñado (docs/00-proyecto/FASES_Y_MEJORAS.md fila 09, "Rediseño Neo-Brutalista:
 * Participaciones") a una vista de dos secciones sin pestañas ni historial. El test anterior
 * fallaba porque medía una interfaz que el propio equipo ya había sustituido, no porque el
 * componente actual tuviera un defecto -- ver docs/testing/informe-cobertura.md.
 *
 * Nota: el componente recibe también las props `misInsignias`, `exposActivas` y
 * `bountiesActivos`, pero no las usa en el render (ver ParticipacionesClient.tsx). Es una
 * característica marcada "En Progreso" en el registro de fases, no un defecto de este test: se
 * pasan como no usadas a propósito y no se afirma nada sobre ellas aquí.
 */
describe('ParticipacionesClient', () => {
  const mockRefresh = vi.fn();
  let mockSupabase: any;

  const misExposicionesMock = [
    {
      id: 'exp1',
      estado: 'aprobado',
      exposiciones_temporales: { titulo: 'Expo Verano', estado: 'activa', imagen_url: '/expo.jpg' },
      sets: { id: 'set1', nombre: 'Halcón Milenario' },
    },
    {
      id: 'exp2',
      estado: 'pendiente',
      exposiciones_temporales: { titulo: 'Expo Invierno', estado: 'finalizada', imagen_url: null },
      sets: { id: 'set2', nombre: 'Castillo' },
    },
  ];

  const misBountiesMock = [
    { id: 'b1', nombre_set: 'Set Raro', descripcion: 'Encuéntralo', recompensa: 300 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ refresh: mockRefresh });

    mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };
    (createClient as any).mockReturnValue(mockSupabase);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renderiza el encabezado y los contadores de exposiciones y bounties', () => {
    render(
      <ParticipacionesClient
        misExposiciones={misExposicionesMock}
        misBounties={misBountiesMock}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    expect(screen.getByText('Mis Participaciones')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // contador de exposiciones
    expect(screen.getByText('1')).toBeInTheDocument(); // contador de bounties
  });

  it('muestra el estado vacío cuando no hay exposiciones ni bounties', () => {
    render(
      <ParticipacionesClient
        misExposiciones={[]}
        misBounties={[]}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    expect(screen.getByText('¡Aún no has participado!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar Exposiciones/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver Bounties Disponibles/i })).toBeInTheDocument();
  });

  it('renderiza las tarjetas de exposiciones con título, set y estado', () => {
    render(
      <ParticipacionesClient
        misExposiciones={misExposicionesMock}
        misBounties={[]}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    expect(screen.getByText('Expo Verano')).toBeInTheDocument();
    expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    expect(screen.getByText('aprobado')).toBeInTheDocument();
    expect(screen.getByText('Expo Invierno')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
  });

  it('solo muestra "Retirar Set" cuando la exposición asociada está activa', () => {
    render(
      <ParticipacionesClient
        misExposiciones={misExposicionesMock}
        misBounties={[]}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    // exp1 -> exposición 'activa': botón visible. exp2 -> 'finalizada': no debe aparecer.
    expect(screen.getAllByText('Retirar Set')).toHaveLength(1);
  });

  it('renderiza las tarjetas de bounties con nombre y recompensa, enlazando al detalle', () => {
    render(
      <ParticipacionesClient
        misExposiciones={[]}
        misBounties={misBountiesMock}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    expect(screen.getByText('Set Raro')).toBeInTheDocument();
    expect(screen.getByText('Encuéntralo')).toBeInTheDocument();
    expect(screen.getByText('300 Pts')).toBeInTheDocument();
    const link = screen.getByText('Set Raro').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard/participaciones/b1');
  });

  it('retira una participación: confirma, borra en Supabase, notifica éxito y refresca', async () => {
    render(
      <ParticipacionesClient
        misExposiciones={misExposicionesMock}
        misBounties={[]}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    fireEvent.click(screen.getByText('Retirar Set'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(mockSupabase.from).toHaveBeenCalledWith('exposicion_sets'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Participación retirada con éxito'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('no borra nada si el usuario cancela la confirmación', () => {
    (window.confirm as any).mockReturnValue(false);

    render(
      <ParticipacionesClient
        misExposiciones={misExposicionesMock}
        misBounties={[]}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    fireEvent.click(screen.getByText('Retirar Set'));

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('muestra un toast de error si falla el borrado en Supabase', async () => {
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
      }),
    });

    render(
      <ParticipacionesClient
        misExposiciones={misExposicionesMock}
        misBounties={[]}
        misInsignias={[]}
        exposActivas={[]}
        bountiesActivos={[]}
      />
    );

    fireEvent.click(screen.getByText('Retirar Set'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al retirar la participación'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
