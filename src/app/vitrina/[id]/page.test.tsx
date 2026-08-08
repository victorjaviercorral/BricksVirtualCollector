import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

vi.mock('@/components/VitrinaClient', () => ({
  default: ({ id }: { id: string }) => <div data-testid="vitrina-client">{id}</div>
}));

describe('Vitrina Page (SSR)', () => {
  it('renderiza VitrinaClient pasandole el parametro id resuelto', async () => {
    const mockParams = Promise.resolve({ id: 'vitrina-123' });
    const jsx = await Page({ params: mockParams });
    
    render(jsx);
    
    expect(screen.getByTestId('vitrina-client')).toHaveTextContent('vitrina-123');
  });
});
