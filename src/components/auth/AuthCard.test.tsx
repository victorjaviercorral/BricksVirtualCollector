import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthCard } from './AuthCard';

describe('AuthCard', () => {
  it('renderiza título, subtítulo, icono y children', () => {
    render(
      <AuthCard icon={<span data-testid="icon" />} title="Acceso Seguro" subtitle="Entra a tu comunidad">
        <p>contenido del formulario</p>
      </AuthCard>
    );

    expect(screen.getByRole('heading', { name: 'Acceso Seguro' })).toBeInTheDocument();
    expect(screen.getByText('Entra a tu comunidad')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('contenido del formulario')).toBeInTheDocument();
  });

  it('admite un subtítulo con nodos de React', () => {
    render(
      <AuthCard icon={null} title="Crea tu cuenta" subtitle={<a href="/x">enlace</a>}>
        <span />
      </AuthCard>
    );
    expect(screen.getByRole('link', { name: 'enlace' })).toHaveAttribute('href', '/x');
  });
});
