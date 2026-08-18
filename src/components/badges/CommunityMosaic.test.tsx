import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommunityMosaic from './CommunityMosaic';

describe('CommunityMosaic', () => {
  it('muestra el estado "Próximamente" en vez del mosaico simulado (hallazgo D3)', () => {
    render(<CommunityMosaic />);

    expect(screen.getByText('Mosaico Comunitario')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
    expect(screen.queryByText(/Tus Bloques/i)).not.toBeInTheDocument();
  });
});
