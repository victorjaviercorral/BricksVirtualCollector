import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipacionesDetailClient from './ParticipacionesDetailClient';

describe('ParticipacionesDetailClient', () => {
  const participacion = {
    id: 'r1',
    nombreSet: 'Halcón Milenario UCS',
    tematica: 'Star Wars',
    recompensa: 500,
    estado: 'reclamado',
    fechaReclamo: '2026-08-18T10:00:00.000Z',
    set: { id: 's1', nombre: 'Mi Halcón Milenario' },
  };

  it('renderiza el nombre del set, la temática y la recompensa', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    expect(screen.getByText('Halcón Milenario UCS')).toBeInTheDocument();
    expect(screen.getByText('Star Wars')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('enlaza al set real con el que se reclamó el bounty', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    const setLink = screen.getByText('Mi Halcón Milenario').closest('a');
    expect(setLink).toHaveAttribute('href', '/set/s1');
  });

  it('muestra la fecha de reclamo formateada', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    expect(screen.getAllByText(/18 de agosto de 2026/i).length).toBeGreaterThan(0);
  });

  it('no muestra el enlace al set si el reclamo no tiene uno asociado (reclamos anteriores a la migración)', () => {
    render(<ParticipacionesDetailClient participacion={{ ...participacion, set: null }} />);

    expect(screen.queryByText('Mi Halcón Milenario')).not.toBeInTheDocument();
  });

  it('no muestra la etiqueta de temática si no hay bounty asociado', () => {
    render(<ParticipacionesDetailClient participacion={{ ...participacion, tematica: null }} />);

    expect(screen.queryByText('Star Wars')).not.toBeInTheDocument();
  });

  it('enlaza "Volver a Participaciones" a la ruta de listado', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    const backLink = screen.getByText('Volver a Participaciones').closest('a');
    expect(backLink).toHaveAttribute('href', '/dashboard/participaciones');
  });
});
