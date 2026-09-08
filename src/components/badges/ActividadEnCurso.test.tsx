import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActividadEnCurso, { tiempoRestante } from './ActividadEnCurso';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { ParticipacionActiva } from '@/lib/queries/insignias-usuario';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

const participacion = (over: Partial<ParticipacionActiva> = {}): ParticipacionActiva => ({
  id: 'p1',
  estado: 'aprobado',
  exposicion_id: 'e1',
  set_id: 's1',
  exposiciones_temporales: {
    titulo: 'Star Wars Day',
    estado: 'activa',
    imagen_url: null,
    fecha_fin: null,
    es_continua: true,
  },
  sets: { id: 's1', nombre: 'Halcón Milenario' },
  ...over,
});

const mockDelete = (error: unknown = null) => {
  const eq = vi.fn().mockResolvedValue({ error });
  vi.mocked(createClient).mockReturnValue({
    from: vi.fn().mockReturnValue({ delete: () => ({ eq }) }),
  } as unknown as ReturnType<typeof createClient>);
  return eq;
};

describe('tiempoRestante', () => {
  it('una exposición continua no tiene cuenta atrás', () => {
    expect(tiempoRestante({ es_continua: true })).toBe('Exposición continua');
  });

  it('sin fecha de fin tampoco se inventa una cuenta atrás', () => {
    expect(tiempoRestante({ fecha_fin: null })).toBe('Exposición continua');
  });

  it('cuenta los días que faltan', () => {
    const dentroDeTresDias = new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString();
    expect(tiempoRestante({ fecha_fin: dentroDeTresDias })).toBe('Quedan 3 días');
  });

  it('concuerda el singular con un solo día', () => {
    const manana = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
    expect(tiempoRestante({ fecha_fin: manana })).toBe('Quedan 1 día');
  });

  it('a menos de un día cambia a horas', () => {
    const enCincoHoras = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    expect(tiempoRestante({ fecha_fin: enCincoHoras })).toBe('Quedan 5 h');
  });

  it('una fecha ya pasada avisa de cierre inminente', () => {
    expect(tiempoRestante({ fecha_fin: new Date(Date.now() - 1000).toISOString() })).toBe('Cierre inminente');
  });

  it('sin exposición no hay nada que contar', () => {
    expect(tiempoRestante(null)).toBeNull();
  });
});

describe('ActividadEnCurso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete();
  });

  it('sin participaciones ofrece salida a exposiciones en vez de dejar la sección muda', () => {
    render(<ActividadEnCurso participaciones={[]} posiciones={{}} />);

    expect(screen.getByText('No tienes nada en juego ahora mismo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver exposiciones' })).toHaveAttribute('href', '/exposiciones');
  });

  it('enlaza cada participación a su exposición y a su set', () => {
    render(<ActividadEnCurso participaciones={[participacion()]} posiciones={{}} />);

    expect(screen.getByRole('link', { name: 'Star Wars Day' })).toHaveAttribute('href', '/exposicion/e1');
    expect(screen.getByRole('link', { name: 'Halcón Milenario' })).toHaveAttribute('href', '/set/s1');
  });

  it('muestra el puesto en el ranking en vivo cuando lo hay', () => {
    render(
      <ActividadEnCurso
        participaciones={[participacion()]}
        posiciones={{ p1: { posicion: 2, bricks: 14, total: 9 } }}
      />
    );

    expect(screen.getByText(/#2 de 9 · 14 bricks/)).toBeInTheDocument();
  });

  it('sin puesto calculado no inventa una posición', () => {
    render(<ActividadEnCurso participaciones={[participacion()]} posiciones={{ p1: null }} />);

    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });

  it('distingue los tres estados de moderación', () => {
    render(
      <ActividadEnCurso
        participaciones={[
          participacion(),
          participacion({ id: 'p2', estado: 'pendiente' }),
          participacion({ id: 'p3', estado: 'rechazado' }),
        ]}
        posiciones={{}}
      />
    );

    expect(screen.getByText('En el ranking')).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
    expect(screen.getByText('No aprobado')).toBeInTheDocument();
  });

  it('un estado desconocido cae a "En revisión" en vez de dejar la etiqueta vacía', () => {
    render(<ActividadEnCurso participaciones={[participacion({ estado: 'lo-que-sea' })]} posiciones={{}} />);

    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });

  it('retira la participación tras confirmar y refresca la vista', async () => {
    const eq = mockDelete();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ActividadEnCurso participaciones={[participacion()]} posiciones={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /Retirar Set/ }));

    await waitFor(() => expect(eq).toHaveBeenCalledWith('id', 'p1'));
    expect(toast.success).toHaveBeenCalledWith('Participación retirada con éxito');
    expect(refresh).toHaveBeenCalled();
  });

  it('no retira nada si el usuario cancela la confirmación', () => {
    const eq = mockDelete();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ActividadEnCurso participaciones={[participacion()]} posiciones={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /Retirar Set/ }));

    expect(eq).not.toHaveBeenCalled();
  });

  it('avisa del error y no refresca si la retirada falla', async () => {
    mockDelete({ message: 'RLS' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ActividadEnCurso participaciones={[participacion()]} posiciones={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /Retirar Set/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error al retirar la participación'));
    expect(refresh).not.toHaveBeenCalled();
  });
});
