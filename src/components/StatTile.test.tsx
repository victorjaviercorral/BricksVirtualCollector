import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatTile from './StatTile';

describe('StatTile', () => {
  it('pinta el valor y la etiqueta', () => {
    render(<StatTile icono={<span>icon</span>} valor="42" etiqueta="Sets" />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Sets')).toBeInTheDocument();
  });

  it('pinta el icono recibido', () => {
    render(<StatTile icono={<span data-testid="mi-icono" />} valor="1" etiqueta="X" />);

    expect(screen.getByTestId('mi-icono')).toBeInTheDocument();
  });

  it('sin nota no pinta la línea adicional', () => {
    render(<StatTile icono={<span />} valor="1" etiqueta="X" />);

    expect(screen.queryByText(/./, { selector: 'p.text-brand-green' })).not.toBeInTheDocument();
  });

  it('con nota la muestra debajo de la etiqueta', () => {
    render(<StatTile icono={<span />} valor="3" etiqueta="Retos" nota="1.000 Bricks ganados" />);

    expect(screen.getByText('1.000 Bricks ganados')).toBeInTheDocument();
  });

  it('la etiqueta es un heading, para que la tarjeta sea navegable con lector de pantalla', () => {
    render(<StatTile icono={<span />} valor="1" etiqueta="Piezas" />);

    expect(screen.getByRole('heading', { name: 'Piezas' })).toBeInTheDocument();
  });
});
