import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Mis Vitrinas Page (Placeholder)', () => {
  it('renderiza la cabecera del placeholder', () => {
    render(<Page />);
    expect(screen.getByText('Pantalla Mis Vitrinas')).toBeInTheDocument();
    expect(screen.getByText('Contenido simulado para verificar el flujo.')).toBeInTheDocument();
  });
});
