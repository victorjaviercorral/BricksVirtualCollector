import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InsigniasClient from './InsigniasClient';

vi.mock('./BadgeShowcase', () => ({ default: () => <div data-testid="badge-showcase" /> }));
vi.mock('./CommunityMosaic', () => ({ default: () => <div data-testid="community-mosaic" /> }));
vi.mock('./ExhibitionPassport', () => ({
  default: ({ sellos }: { sellos: unknown[] }) => <div data-testid="exhibition-passport">Sellos: {sellos.length}</div>,
}));

describe('InsigniasClient', () => {
  const userProfile = { avatar_url: null, creado_en: '2026-01-15T00:00:00.000Z' };
  const user = { id: 'u1', created_at: '2026-01-15T00:00:00.000Z' };

  it('muestra el recuento real de bounties recibido por props, no un valor simulado', () => {
    render(<InsigniasClient userProfile={userProfile} user={user} misInsignias={[]} bountiesCount={7} />);

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('el contador de "Insignias" del header sale de la longitud real de misInsignias', () => {
    const misInsignias = [
      { id: 'i1', rango: 1, titulo_insignia: '🥇 1er Puesto', fecha_otorgada: null, exposiciones_temporales: { titulo: 'Expo A' } },
      { id: 'i2', rango: 2, titulo_insignia: '🥈 2º Puesto', fecha_otorgada: null, exposiciones_temporales: { titulo: 'Expo B' } },
    ];

    render(<InsigniasClient userProfile={userProfile} user={user} misInsignias={misInsignias} bountiesCount={0} />);

    // El "2" aparece tanto en el stat de cabecera como en el badge de la pestaña Pasaporte.
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('el Mosaico se muestra como "Próximamente", no con un número inventado', () => {
    render(<InsigniasClient userProfile={userProfile} user={user} misInsignias={[]} bountiesCount={0} />);

    expect(screen.getByText('Próximamente')).toBeInTheDocument();
    expect(screen.queryByText(/Blocks/i)).not.toBeInTheDocument();
  });

  it('resuelve la relación con exposiciones_temporales aunque el cliente la infiera como array', () => {
    const misInsignias = [
      { id: 'i1', rango: 1, titulo_insignia: '🥇 1er Puesto', fecha_otorgada: null, exposiciones_temporales: [{ titulo: 'Expo Array' }] },
    ];

    render(<InsigniasClient userProfile={userProfile} user={user} misInsignias={misInsignias} bountiesCount={0} />);

    fireEvent.click(screen.getByText('Pasaporte de Exposiciones'));
    expect(screen.getByTestId('exhibition-passport')).toHaveTextContent('Sellos: 1');
  });

  it('cambia entre pestañas mostrando el panel correcto', () => {
    render(<InsigniasClient userProfile={userProfile} user={user} misInsignias={[]} bountiesCount={0} />);

    // Por defecto: Vitrina de Insignias
    expect(screen.getByTestId('badge-showcase')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Pasaporte de Exposiciones'));
    expect(screen.getByTestId('exhibition-passport')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mosaico Comunitario'));
    expect(screen.getByTestId('community-mosaic')).toBeInTheDocument();
  });

  it('usa valores por defecto seguros si no se pasan misInsignias/bountiesCount', () => {
    render(<InsigniasClient userProfile={userProfile} user={user} />);

    // Bounties e Insignias caen ambos a "0" por defecto -- puede haber más de un "0" en pantalla.
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1);
  });
});
