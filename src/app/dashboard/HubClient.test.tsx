import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HubClient from './HubClient';

// framer-motion causa problemas de animación/interactividad en JSDOM; se sustituye por los
// elementos DOM planos equivalentes, siguiendo la misma convención que
// src/app/dashboard/perfil/page.test.tsx y src/app/admin/exposiciones/page.test.tsx.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}));

describe('HubClient', () => {
  const baseProps = {
    userProfile: { total_bricks_recibidos: 0 },
    exposicionesActivas: [] as any[],
    bountiesActivos: [] as any[],
    setDestacado: null,
    comunidadSets: [] as any[],
    ultimaInsignia: null,
  };

  it('renderiza los estados vacíos cuando no hay datos de ningún tipo', () => {
    render(<HubClient {...baseProps} />);

    expect(screen.getByText('Explora el Museo')).toBeInTheDocument();
    expect(screen.getByText('Próximamente...')).toBeInTheDocument();
    expect(screen.getByText('Sin exposición activa')).toBeInTheDocument();
    expect(screen.getByText('¡Participa para ganar!')).toBeInTheDocument();
    expect(screen.getByText('Pronto más eventos')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay actividad.')).toBeInTheDocument();
    expect(screen.getByText('Sin retos ahora')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // bricks recibidos
    // Sin setDestacado no debe existir el botón "Dar Bricks"
    expect(screen.queryByText('Dar Bricks')).not.toBeInTheDocument();
  });

  it('renderiza el set destacado con su vitrina, imagen y autor', () => {
    render(
      <HubClient
        {...baseProps}
        setDestacado={{
          nombre: 'Halcón Milenario',
          vitrina_id: 'v1',
          fotos: [{ url: '/halcon.jpg' }],
          usuarios_perfil: { username: 'BrickMaster' },
        }}
      />
    );

    expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    expect(screen.getByText('@BrickMaster')).toBeInTheDocument();
    const link = screen.getByText('Dar Bricks').closest('a');
    expect(link).toHaveAttribute('href', '/vitrina/v1');
    expect(screen.getByAltText('Build of the day')).toHaveAttribute('src', '/halcon.jpg');
  });

  it('renderiza la exposición activa y la próxima cuando hay más de una activa', () => {
    render(
      <HubClient
        {...baseProps}
        exposicionesActivas={[
          { id: 'e1', titulo: 'Expo Verano', imagen_url: '/e1.jpg', es_continua: false },
          { id: 'e2', titulo: 'Expo Otoño', es_continua: true },
        ]}
      />
    );

    expect(screen.getByText('¡Participa ahora!')).toBeInTheDocument();
    expect(screen.getByText('Expo Verano')).toBeInTheDocument();
    expect(screen.getByText('TIEMPO LIMITADO')).toBeInTheDocument();
    const activeLink = screen.getByText('Expo Verano').closest('a');
    expect(activeLink).toHaveAttribute('href', '/exposicion/e1');

    expect(screen.getByText('Expo Otoño')).toBeInTheDocument();
    expect(screen.getByText('Continua')).toBeInTheDocument();
  });

  it('no muestra "más eventos" cuando solo hay una exposición activa', () => {
    render(
      <HubClient
        {...baseProps}
        exposicionesActivas={[{ id: 'e1', titulo: 'Única Expo', es_continua: false }]}
      />
    );

    expect(screen.getByText('Pronto más eventos')).toBeInTheDocument();
  });

  it('renderiza la última insignia con la exposición que la otorgó', () => {
    render(
      <HubClient
        {...baseProps}
        ultimaInsignia={{
          titulo_insignia: 'Maestro Constructor',
          exposiciones_temporales: { titulo: 'Expo Verano' },
        }}
      />
    );

    expect(screen.getByText('Maestro Constructor')).toBeInTheDocument();
    expect(screen.getByText('Por: Expo Verano')).toBeInTheDocument();
  });

  it('renderiza la lista de la comunidad cuando hay sets recientes', () => {
    render(
      <HubClient
        {...baseProps}
        comunidadSets={[
          { id: 's1', nombre: 'Castillo', vitrina_id: 'v9', usuarios_perfil: { username: 'Ana' }, fotos: [{ url: '/c.jpg' }] },
          { id: 's2', nombre: 'Torre', vitrina_id: 'v10', usuarios_perfil: null, fotos: [] },
        ]}
      />
    );

    expect(screen.getByText('Castillo')).toBeInTheDocument();
    expect(screen.getByText('@Ana')).toBeInTheDocument();
    expect(screen.getByText('Torre')).toBeInTheDocument();
    expect(screen.getByText('@Anónimo')).toBeInTheDocument(); // fallback sin usuarios_perfil
    expect(screen.queryByText('Aún no hay actividad.')).not.toBeInTheDocument();
  });

  it('muestra el conteo de bounties activos cuando hay retos disponibles', () => {
    render(
      <HubClient
        {...baseProps}
        bountiesActivos={[{ id: 'b1' }, { id: 'b2' }]}
      />
    );

    expect(screen.getByText('2 Retos activos')).toBeInTheDocument();
    expect(screen.queryByText('Sin retos ahora')).not.toBeInTheDocument();
  });

  it('muestra el total de bricks recibidos del perfil', () => {
    render(<HubClient {...baseProps} userProfile={{ total_bricks_recibidos: 1450 }} />);

    expect(screen.getByText('1450')).toBeInTheDocument();
  });
});
