import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MesaTrabajoPage from './page';

// Mock the client component so we don't have to deal with its dependencies
vi.mock('@/components/MesaTrabajoClient', () => {
  return {
    default: () => <div data-testid="mesa-trabajo-client">Client</div>,
  };
});

describe('MesaTrabajoPage', () => {
  it('debe renderizar el cliente dentro del suspense', () => {
    const { getByTestId } = render(<MesaTrabajoPage />);
    expect(getByTestId('mesa-trabajo-client')).toBeInTheDocument();
  });
});
