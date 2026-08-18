import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExhibitionPassport, { type Sello } from './ExhibitionPassport';

describe('ExhibitionPassport', () => {
  it('muestra un estado vacío honesto cuando no hay sellos (no inventa datos)', () => {
    render(<ExhibitionPassport sellos={[]} />);

    expect(screen.getByText(/Todavía no tienes ningún sello/i)).toBeInTheDocument();
  });

  it('renderiza un sello por cada insignia real, con su título de exposición y posición', () => {
    const sellos: Sello[] = [
      { id: 'i1', titulo: 'Star Wars Day', fecha: '2026-05-04T00:00:00.000Z', posicion: '🥇 1er Puesto' },
      { id: 'i2', titulo: 'Vintage Classics', fecha: null, posicion: 'Participante' },
    ];

    render(<ExhibitionPassport sellos={sellos} />);

    expect(screen.getByText('Star Wars Day')).toBeInTheDocument();
    expect(screen.getByText('🥇 1er Puesto')).toBeInTheDocument();
    expect(screen.getByText('Vintage Classics')).toBeInTheDocument();
    expect(screen.getByText('Participante')).toBeInTheDocument();
  });

  it('formatea la fecha del sello cuando existe', () => {
    const sellos: Sello[] = [
      { id: 'i1', titulo: 'Star Wars Day', fecha: '2026-05-04T00:00:00.000Z', posicion: '🥇 1er Puesto' },
    ];

    render(<ExhibitionPassport sellos={sellos} />);

    expect(screen.getByText(/4 may 2026/i)).toBeInTheDocument();
  });

  it('no muestra fecha si el sello no la tiene', () => {
    const sellos: Sello[] = [
      { id: 'i1', titulo: 'Vintage Classics', fecha: null, posicion: 'Participante' },
    ];

    const { container } = render(<ExhibitionPassport sellos={sellos} />);

    expect(container.querySelector('svg')).toBeTruthy(); // el icono del sello sigue ahí
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument(); // pero ningún año suelto
  });
});
