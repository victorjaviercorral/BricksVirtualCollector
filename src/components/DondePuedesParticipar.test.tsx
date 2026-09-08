import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DondePuedesParticipar from './DondePuedesParticipar';

describe('DondePuedesParticipar', () => {
  it('no pinta nada si el usuario ya está en todo lo abierto', () => {
    const { container } = render(<DondePuedesParticipar exposiciones={[]} bounties={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sin props tampoco pinta una sección vacía', () => {
    const { container } = render(<DondePuedesParticipar />);

    expect(container).toBeEmptyDOMElement();
  });

  it('enlaza cada exposición recomendada a su ficha', () => {
    render(
      <DondePuedesParticipar
        exposiciones={[{ id: 'e1', titulo: 'Star Wars Day', descripcion: 'Trae tu nave' }]}
      />
    );

    expect(screen.getByRole('link', { name: /Star Wars Day/ })).toHaveAttribute('href', '/exposicion/e1');
    expect(screen.getByText('Trae tu nave')).toBeInTheDocument();
  });

  it('enlaza los retos al tablero de bounties', () => {
    render(<DondePuedesParticipar bounties={[{ id: 'b1', nombre_set: 'Halcón Milenario', recompensa: 500 }]} />);

    expect(screen.getByRole('link', { name: /Halcón Milenario/ })).toHaveAttribute('href', '/bounties');
  });

  it('anuncia la recompensa efectiva en Bricks, no la nominal', () => {
    render(<DondePuedesParticipar bounties={[{ id: 'b1', nombre_set: 'Reto Grande', recompensa: 5000 }]} />);

    expect(screen.getByText(/1000 Bricks/)).toBeInTheDocument();
    expect(screen.queryByText(/5000 Bricks/)).not.toBeInTheDocument();
  });

  it('un reto sin título usa el nombre del set, y si no lo hay un texto genérico', () => {
    render(
      <DondePuedesParticipar
        bounties={[
          { id: 'b1', titulo: 'Con Título', nombre_set: 'Ignorado' },
          { id: 'b2' },
        ]}
      />
    );

    expect(screen.getByText('Con Título')).toBeInTheDocument();
    expect(screen.getByText('Reto de la comunidad')).toBeInTheDocument();
  });

  it('muestra exposiciones y retos a la vez cuando hay de los dos', () => {
    render(
      <DondePuedesParticipar
        exposiciones={[{ id: 'e1', titulo: 'Expo' }]}
        bounties={[{ id: 'b1', nombre_set: 'Reto' }]}
      />
    );

    expect(screen.getByText('Exposición abierta')).toBeInTheDocument();
    expect(screen.getByText('Reto abierto')).toBeInTheDocument();
  });

  it('explica para qué sirve apuntarse, ahora que vive junto a los sets del usuario', () => {
    render(<DondePuedesParticipar exposiciones={[{ id: 'e1', titulo: 'Expo' }]} />);

    expect(screen.getByRole('heading', { name: 'Dónde puedes participar' })).toBeInTheDocument();
    expect(screen.getByText(/Apunta uno de tus sets/)).toBeInTheDocument();
  });
});
