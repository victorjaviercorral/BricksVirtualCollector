import { Suspense } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditarMesaTrabajo from './page';
import { useRouter } from 'next/navigation';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/data', () => ({
  MOCK_SETS: [
    {
      id: 'set-mock-1',
      name: 'Set de Prueba',
      theme: 'Star Wars',
      image: '/mock.jpg',
    }
  ]
}));

import * as React from 'react';

// Mock de react para sobreescribir 'use' sin romper otras exportaciones
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    use: vi.fn((p: any) => ({ id: 'set-mock-1' }))
  };
});

describe('EditarMesaTrabajo Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('debe renderizar la página con los datos del mock', () => {
    render(<EditarMesaTrabajo params={Promise.resolve({ id: 'set-mock-1' })} />);
    
    expect(screen.getByText('Editar Vitrina')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Set de Prueba')).toBeInTheDocument();
  });

  it('debe renderizar el primer set por defecto si no se encuentra el ID', () => {
    // Como el mock de use() siempre devuelve 'set-mock-1' actualmente, 
    // necesitamos sobreescribirlo para esta prueba.
    vi.mocked(React.use).mockImplementationOnce(() => ({ id: 'no-existe' }));
    
    render(<EditarMesaTrabajo params={Promise.resolve({ id: 'no-existe' })} />);
    
    // Debería usar el de fallback que es el primero en MOCK_SETS (que justo se llama igual 'Set de Prueba' en nuestro test)
    expect(screen.getByDisplayValue('Set de Prueba')).toBeInTheDocument();
  });

  it('debe simular guardar cambios y redirigir', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<EditarMesaTrabajo params={Promise.resolve({ id: 'set-mock-1' })} />);
    
    const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
    
    vi.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    vi.useRealTimers();
  });

  it('debe simular borrar vitrina pidiendo confirmación y redirigir', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<EditarMesaTrabajo params={Promise.resolve({ id: 'set-mock-1' })} />);
    
    const deleteButton = screen.getByRole('button', { name: /borrar vitrina/i });
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByText('Borrando...')).toBeInTheDocument();
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    vi.useRealTimers();
  });

  it('no debe borrar si el usuario cancela la confirmación', async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<EditarMesaTrabajo params={Promise.resolve({ id: 'set-mock-1' })} />);
    
    const deleteButton = screen.getByRole('button', { name: /borrar vitrina/i });
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /borrar vitrina/i })).not.toHaveTextContent('Borrando...');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
