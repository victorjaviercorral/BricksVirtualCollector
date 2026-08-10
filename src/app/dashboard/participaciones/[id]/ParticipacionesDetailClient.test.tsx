import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipacionesDetailClient from './ParticipacionesDetailClient';

describe('ParticipacionesDetailClient', () => {
  const participacion = {
    id: 'p1',
    titulo: 'Modular Master',
    descripcion: 'Sube fotos de 3 sets modulares diferentes',
    recompensa: 500,
    progreso: 66,
    requisitos: [
      { id: 1, texto: 'Sets oficiales de Lego' },
      { id: 2, texto: 'Fotos claras y bien iluminadas' },
    ],
    tareas: [
      { id: 1, texto: 'Set #10297', estado: 'aprobado' },
      { id: 2, texto: 'Set #10260', estado: 'pendiente' },
    ],
  };

  it('renderiza título, recompensa, descripción y progreso', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    expect(screen.getByText('Modular Master')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Sube fotos de 3 sets modulares diferentes')).toBeInTheDocument();
    expect(screen.getByText('66%')).toBeInTheDocument();
  });

  it('renderiza cada requisito y cada tarea con su estado', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    expect(screen.getByText('Sets oficiales de Lego')).toBeInTheDocument();
    expect(screen.getByText('Fotos claras y bien iluminadas')).toBeInTheDocument();

    expect(screen.getByText('Set #10297')).toBeInTheDocument();
    expect(screen.getByText('(aprobado)')).toBeInTheDocument();
    expect(screen.getByText('Set #10260')).toBeInTheDocument();
    expect(screen.getByText('(pendiente)')).toBeInTheDocument();
  });

  it('enlaza "Volver a Participaciones" a la ruta de listado', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    const backLink = screen.getByText('Volver a Participaciones').closest('a');
    expect(backLink).toHaveAttribute('href', '/dashboard/participaciones');
  });

  it('alterna el texto del botón de acción al pulsarlo (estado de subida)', () => {
    render(<ParticipacionesDetailClient participacion={participacion} />);

    const button = screen.getByText('Subir Nueva Participación');
    fireEvent.click(button);

    expect(screen.getByText('Subiendo...')).toBeInTheDocument();
    expect(screen.queryByText('Subir Nueva Participación')).not.toBeInTheDocument();
  });
});
