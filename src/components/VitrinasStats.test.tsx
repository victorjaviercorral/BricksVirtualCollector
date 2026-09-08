import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VitrinasStats from './VitrinasStats';

describe('VitrinasStats', () => {
  it('sin sets no pinta nada: no hay contexto que dar todavía', () => {
    const { container } = render(<VitrinasStats numSets={0} bricksRecibidos={0} temas={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el total de sets y de bricks recibidos, con separador de miles', () => {
    render(<VitrinasStats numSets={4} bricksRecibidos={12480} temas={[]} />);

    expect(screen.getByText('Sets')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Bricks recibidos')).toBeInTheDocument();
    expect(screen.getByText('12.480')).toBeInTheDocument();
  });

  it('lista cada temática como una chip', () => {
    render(<VitrinasStats numSets={2} bricksRecibidos={0} temas={['Star Wars', 'Technic']} />);

    expect(screen.getByText('Star Wars')).toBeInTheDocument();
    expect(screen.getByText('Technic')).toBeInTheDocument();
  });

  it('sin temáticas todavía no pinta la fila de chips ni su etiqueta', () => {
    render(<VitrinasStats numSets={1} bricksRecibidos={0} temas={[]} />);

    expect(screen.queryByText('Temáticas')).not.toBeInTheDocument();
  });

  it('con sets pero sin bricks recibidos muestra 0, no lo oculta', () => {
    render(<VitrinasStats numSets={1} bricksRecibidos={0} temas={[]} />);

    expect(screen.getByText('Bricks recibidos')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(1);
  });
});
