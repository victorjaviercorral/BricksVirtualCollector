import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BadgeShowcase from './BadgeShowcase';

describe('BadgeShowcase', () => {
  it('muestra el estado "Próximamente" en vez de logros inventados (hallazgo D3)', () => {
    render(<BadgeShowcase />);

    expect(screen.getByText('Vitrina de Insignias')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
    expect(screen.queryByText(/Desbloqueadas/i)).not.toBeInTheDocument();
  });
});
