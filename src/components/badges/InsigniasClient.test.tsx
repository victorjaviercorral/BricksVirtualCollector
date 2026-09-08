import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InsigniasClient from './InsigniasClient';
import { AGREGADOS_VACIOS, evaluarInsignias, type AgregadosUsuario } from '@/lib/insignias-usuario';

vi.mock('./BadgeShowcase', () => ({
  default: ({ avisoPiezas }: { avisoPiezas?: string | null }) => (
    <div data-testid="badge-showcase">{avisoPiezas || 'sin-aviso'}</div>
  ),
}));
vi.mock('./CommunityMosaic', () => ({ default: () => <div data-testid="community-mosaic" /> }));
vi.mock('./SincronizarInsignias', () => ({ default: () => null }));
vi.mock('./ActividadEnCurso', () => ({
  default: ({ participaciones }: { participaciones: unknown[] }) => (
    <div data-testid="actividad-en-curso">{participaciones.length}</div>
  ),
}));
vi.mock('./RecompensasGanadas', () => ({
  default: ({ reclamos }: { reclamos: unknown[] }) => (
    <div data-testid="recompensas">{reclamos.length}</div>
  ),
}));
vi.mock('./ExhibitionPassport', () => ({
  default: ({ sellos }: { sellos: unknown[] }) => <div data-testid="exhibition-passport">Sellos: {sellos.length}</div>,
}));

const agregados = (over: Partial<AgregadosUsuario> = {}): AgregadosUsuario => ({
  ...AGREGADOS_VACIOS,
  ...over,
});

const renderCliente = (props: Partial<React.ComponentProps<typeof InsigniasClient>> = {}) => {
  const datos = props.agregados ?? agregados();
  return render(
    <InsigniasClient
      userProfile={{ avatar_url: null, creado_en: '2026-01-15T00:00:00.000Z' }}
      user={{ created_at: '2026-01-15T00:00:00.000Z' }}
      misInsignias={[]}
      agregados={datos}
      insignias={evaluarInsignias(datos)}
      {...props}
    />
  );
};

describe('InsigniasClient — cabecera de estadísticas', () => {
  it('muestra los 4 contadores, incluido el total de piezas que antes no estaba en ninguna pantalla', () => {
    renderCliente({ agregados: agregados({ piezasTotales: 12480, bricksRecibidos: 37, exposicionesAprobadas: 4, bountiesReclamados: 2 }) });

    expect(screen.getByText('Piezas')).toBeInTheDocument();
    expect(screen.getByText('12.480')).toBeInTheDocument();
    expect(screen.getByText('Bricks recibidos')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.getByText('Exposiciones')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Retos')).toBeInTheDocument();
  });

  it('el contador de retos muestra los Bricks ganados, que hasta ahora no tenían dónde consultarse', () => {
    renderCliente({ agregados: agregados({ bountiesReclamados: 3, bricksDeBounties: 2500 }) });
    expect(screen.getByText('2.500 Bricks ganados')).toBeInTheDocument();
  });

  it('sin recompensas no inventa una nota de Bricks ganados', () => {
    renderCliente({ agregados: agregados({ bountiesReclamados: 0, bricksDeBounties: 0 }) });
    expect(screen.queryByText(/Bricks ganados/)).not.toBeInTheDocument();
  });

  it('se titula "Mis Insignias", el mismo nombre que la entrada de navegación', () => {
    renderCliente();
    expect(screen.getByRole('heading', { level: 1, name: 'Mis Insignias' })).toBeInTheDocument();
  });

  it('muestra desde cuándo es miembro usando creado_en del perfil', () => {
    renderCliente();
    expect(screen.getByText(/enero 2026/)).toBeInTheDocument();
  });

  it('cae a created_at del usuario si el perfil no tiene creado_en', () => {
    renderCliente({ userProfile: { avatar_url: null }, user: { created_at: '2026-03-10T00:00:00.000Z' } });
    expect(screen.getByText(/marzo 2026/)).toBeInTheDocument();
  });

  it('sin ninguna fecha no inventa una: lo declara desconocido', () => {
    renderCliente({ userProfile: null, user: null });
    expect(screen.getByText(/Desconocido/)).toBeInTheDocument();
  });
});

describe('InsigniasClient — secciones', () => {
  it('todas las secciones están en la página a la vez: ya no hay pestañas que oculten contenido', () => {
    renderCliente();
    expect(screen.getByTestId('badge-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('actividad-en-curso')).toBeInTheDocument();
    expect(screen.getByTestId('recompensas')).toBeInTheDocument();
    expect(screen.getByTestId('exhibition-passport')).toBeInTheDocument();
    expect(screen.getByTestId('community-mosaic')).toBeInTheDocument();
  });

  it('los chips de ancla apuntan a cada sección de la página', () => {
    renderCliente();
    expect(screen.getByRole('navigation', { name: 'Secciones de Mis Insignias' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insignias' })).toHaveAttribute('href', '#insignias');
    expect(screen.getByRole('link', { name: 'En curso' })).toHaveAttribute('href', '#en-curso');
    expect(screen.getByRole('link', { name: 'Recompensas' })).toHaveAttribute('href', '#recompensas');
    expect(screen.getByRole('link', { name: 'Pasaporte' })).toHaveAttribute('href', '#pasaporte');
    expect(screen.getByRole('link', { name: 'Mosaico' })).toHaveAttribute('href', '#mosaico');
  });

  it('la actividad en curso y las recompensas viven aquí, no en una pantalla aparte', () => {
    renderCliente({
      actividad: { participaciones: [{ id: 'p1' }, { id: 'p2' }] as never, posiciones: {} },
      reclamos: [{ id: 'r1' }] as never,
    });

    expect(screen.getByTestId('actividad-en-curso')).toHaveTextContent('2');
    expect(screen.getByTestId('recompensas')).toHaveTextContent('1');
  });

  it('pasa al Pasaporte un sello por cada insignia real', () => {
    renderCliente({
      misInsignias: [
        { id: 'i1', exposicion_id: 'e1', rango: 1, titulo_insignia: '🥇 1er Puesto', fecha_otorgada: null, exposiciones_temporales: { titulo: 'Expo A' } },
        { id: 'i2', exposicion_id: 'e2', rango: 2, titulo_insignia: '🥈 2º Puesto', fecha_otorgada: null, exposiciones_temporales: { titulo: 'Expo B' } },
      ],
    });
    expect(screen.getByTestId('exhibition-passport')).toHaveTextContent('Sellos: 2');
  });

  it('resuelve la relación con exposiciones_temporales aunque el cliente la infiera como array', () => {
    renderCliente({
      misInsignias: [
        { id: 'i1', exposicion_id: 'e1', rango: 1, titulo_insignia: '🥇 1er Puesto', fecha_otorgada: null, exposiciones_temporales: [{ titulo: 'Expo Array' }] },
      ],
    });
    expect(screen.getByTestId('exhibition-passport')).toHaveTextContent('Sellos: 1');
  });

  it('traslada a la Vitrina el aviso de piezas incompletas en vez de fingir un total completo', () => {
    renderCliente({ agregados: agregados({ numSets: 5, setsConPiezas: 2, piezasTotales: 900 }) });
    expect(screen.getByTestId('badge-showcase')).toHaveTextContent('3 sets no tienen');
  });

  it('con todos los sets informados no traslada ningún aviso', () => {
    renderCliente({ agregados: agregados({ numSets: 3, setsConPiezas: 3 }) });
    expect(screen.getByTestId('badge-showcase')).toHaveTextContent('sin-aviso');
  });
});
