import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProximamentePanel from './ProximamentePanel';

describe('ProximamentePanel', () => {
  it('renderiza el título, la descripción y la etiqueta "Próximamente"', () => {
    render(<ProximamentePanel titulo="Mi Título" descripcion="Mi descripción." />);

    expect(screen.getByText('Mi Título')).toBeInTheDocument();
    expect(screen.getByText('Mi descripción.')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });
});
