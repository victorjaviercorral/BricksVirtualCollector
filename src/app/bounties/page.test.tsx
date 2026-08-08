import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BountiesPage from './page';

// Mock del componente cliente
vi.mock('@/components/BountiesClient', () => {
  return {
    default: function MockBountiesClient() {
      return <div data-testid="bounties-client">Mock Bounties Client</div>;
    }
  };
});

describe('BountiesPage', () => {
  it('debería renderizar el componente BountiesClient', () => {
    render(<BountiesPage />);
    expect(screen.getByTestId('bounties-client')).toBeInTheDocument();
  });
});
