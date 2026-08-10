import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PerfilPublicoClient from './PerfilPublicoClient';

vi.mock('framer-motion/client', () => ({
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('PerfilPublicoClient', () => {
  const profile = {
    id: 'u1',
    username: 'ana_builder',
    alias: 'Ana la Constructora',
    avatar_url: null,
    total_bricks_recibidos: 1450,
    creado_en: '2024-03-15T00:00:00.000Z',
  };

  const sets = [
    { id: 's1', nombre: 'Halcón Milenario', tematica: 'Star Wars', num_piezas: 7541, bricks_recibidos: 320, fotos: [{ url: '/halcon.jpg' }] },
    { id: 's2', nombre: 'Castillo Medieval', tematica: 'Icons', num_piezas: 4514, bricks_recibidos: 90, fotos: [{ url: '/castillo.jpg' }] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el alias, el año de alta y los contadores reales', () => {
    render(<PerfilPublicoClient profile={profile} sets={sets} />);

    expect(screen.getByText('Ana la Constructora')).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // sets.length
    expect(screen.getByText((12055).toLocaleString())).toBeInTheDocument(); // suma de piezas
    expect(screen.getByText((1450).toLocaleString())).toBeInTheDocument(); // bricks del perfil
  });

  it('usa el username como respaldo cuando no hay alias', () => {
    render(<PerfilPublicoClient profile={{ ...profile, alias: null }} sets={sets} />);

    expect(screen.getByText('ana_builder')).toBeInTheDocument();
  });

  it('muestra el estado vacío y oculta el botón de tour cuando no hay sets públicos', () => {
    render(<PerfilPublicoClient profile={profile} sets={[]} />);

    expect(screen.getByText('Sin sets públicos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Iniciar Visita Guiada/i })).not.toBeInTheDocument();
  });

  it('renderiza cada set de la colección con su nombre', () => {
    render(<PerfilPublicoClient profile={profile} sets={sets} />);

    sets.forEach((set) => {
      expect(screen.getByText(set.nombre)).toBeInTheDocument();
    });
  });

  it('abre y controla el carrusel de la visita guiada', () => {
    render(<PerfilPublicoClient profile={profile} sets={sets} />);

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Visita Guiada/i }));

    expect(screen.getAllByText(sets[0].nombre)[0]).toBeInTheDocument();
    const images = screen.getAllByAltText(sets[0].nombre);
    expect(images[0]).toHaveAttribute('src', '/halcon.jpg');

    fireEvent.click(screen.getByLabelText('Siguiente'));
    expect(screen.getAllByAltText(sets[1].nombre)[0]).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Anterior'));
    expect(screen.getAllByAltText(sets[0].nombre)[0]).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Cerrar tour'));
    expect(screen.queryByText(/Vitrina 1 de/)).not.toBeInTheDocument();
  });
});
