import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
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

type Props = ComponentProps<typeof ParticipacionesClient>;

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
 * pasan como no usadas a propósito y no se afirma nada sobre ellas aquí. Ver hallazgo H6
 * (docs/05-plan/plan-intervencion-post-iteracion-3.md) para el rediseño pendiente que sí las usará.
 */
describe('ParticipacionesClient', () => {
  const mockRefresh = vi.fn();
  let mockSupabaseFrom: ReturnType<typeof vi.fn>;

  const misExposicionesMock: Props['misExposiciones'] = [
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

  const misBountiesMock: Props['misBounties'] = [
    { id: 'b1', nombre_set: 'Set Raro', descripcion: 'Encuéntralo', recompensa: 300 },
  ];

  const baseProps: Props = {
    userProfile: {},
    misExposiciones: [],
    misBounties: [],
    misInsignias: [],
    exposActivas: [],
    bountiesActivos: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>);

    mockSupabaseFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    vi.mocked(createClient).mockReturnValue({ from: mockSupabaseFrom } as unknown as ReturnType<typeof createClient>);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  // --- Hallazgo del 19/08/2026: el avatar estaba hardcodeado a un dicebear de ejemplo
  // ("seed=Felix"), sin que el componente recibiera siquiera el perfil real del usuario ---

  it('muestra la foto de perfil real cuando userProfile.avatar_url existe', () => {
    render(<ParticipacionesClient {...baseProps} userProfile={{ avatar_url: 'https://ejemplo.com/mi-foto.jpg' }} />);

    const avatar = screen.getByAltText('Foto de perfil');
    expect(avatar).toHaveAttribute('src', 'https://ejemplo.com/mi-foto.jpg');
  });

  it('muestra un icono de reserva si el usuario no tiene avatar_url (nunca un avatar de ejemplo)', () => {
    render(<ParticipacionesClient {...baseProps} userProfile={{}} />);

    expect(screen.queryByAltText('Foto de perfil')).not.toBeInTheDocument();
    expect(screen.queryByText(/dicebear/i)).not.toBeInTheDocument();
  });

  it('renderiza el encabezado y los contadores de exposiciones y bounties', () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        misExposiciones={misExposicionesMock}
        misBounties={misBountiesMock}
      />
    );

    expect(screen.getByText('Mis Participaciones')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // contador de exposiciones
    expect(screen.getByText('1')).toBeInTheDocument(); // contador de bounties
  });

  it('muestra el estado vacío cuando no hay exposiciones ni bounties', () => {
    render(<ParticipacionesClient {...baseProps} />);

    expect(screen.getByText('¡Aún no has participado!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explorar Exposiciones/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver Bounties Disponibles/i })).toBeInTheDocument();
  });

  it('renderiza las tarjetas de exposiciones con título, set y estado', () => {
    render(<ParticipacionesClient {...baseProps} misExposiciones={misExposicionesMock} />);

    expect(screen.getByText('Expo Verano')).toBeInTheDocument();
    expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    expect(screen.getByText('aprobado')).toBeInTheDocument();
    expect(screen.getByText('Expo Invierno')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
  });

  it('solo muestra "Retirar Set" cuando la exposición asociada está activa', () => {
    render(<ParticipacionesClient {...baseProps} misExposiciones={misExposicionesMock} />);

    // exp1 -> exposición 'activa': botón visible. exp2 -> 'finalizada': no debe aparecer.
    expect(screen.getAllByText('Retirar Set')).toHaveLength(1);
  });

  it('renderiza las tarjetas de bounties con nombre y recompensa, enlazando al detalle', () => {
    render(<ParticipacionesClient {...baseProps} misBounties={misBountiesMock} />);

    expect(screen.getByText('Set Raro')).toBeInTheDocument();
    expect(screen.getByText('Encuéntralo')).toBeInTheDocument();
    expect(screen.getByText('300 Pts')).toBeInTheDocument();
    const link = screen.getByText('Set Raro').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard/participaciones/b1');
  });

  it('retira una participación: confirma, borra en Supabase, notifica éxito y refresca', async () => {
    render(<ParticipacionesClient {...baseProps} misExposiciones={misExposicionesMock} />);

    fireEvent.click(screen.getByText('Retirar Set'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(mockSupabaseFrom).toHaveBeenCalledWith('exposicion_sets'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Participación retirada con éxito'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('no borra nada si el usuario cancela la confirmación', () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<ParticipacionesClient {...baseProps} misExposiciones={misExposicionesMock} />);

    fireEvent.click(screen.getByText('Retirar Set'));

    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  it('muestra un toast de error si falla el borrado en Supabase', async () => {
    mockSupabaseFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'db error' } }),
      }),
    });

    render(<ParticipacionesClient {...baseProps} misExposiciones={misExposicionesMock} />);

    fireEvent.click(screen.getByText('Retirar Set'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al retirar la participación'));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
