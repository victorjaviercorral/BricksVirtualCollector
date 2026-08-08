import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BountiesClient from './BountiesClient';

// Mock del router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  })
}));

// Mock de Supabase
const { mockOrder, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockOrder = vi.fn();
  const mockSelect = vi.fn(() => ({ order: mockOrder }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockOrder, mockSelect, mockFrom };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

// Setup de variables de entorno para evitar errores en creación de cliente
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

describe('BountiesClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debería mostrar estado de carga inicialmente', () => {
    // Configuramos una promesa pendiente para el select
    mockOrder.mockReturnValue(new Promise(() => {}));
    
    const { container } = render(<BountiesClient />);
    // Buscamos algún indicador visual de carga (el spinner tiene border-t-transparent)
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('debería mostrar mensaje de "Todo limpio" si no hay bounties', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    
    render(<BountiesClient />);
    
    await waitFor(() => {
      expect(screen.getByText('¡Todo limpio!')).toBeInTheDocument();
    });
    expect(screen.getByText(/No hay bounties activos en este momento/i)).toBeInTheDocument();
  });

  it('debería renderizar la lista de bounties activos', async () => {
    const mockBounties = [
      { id: '1', nombre_set: 'Halcón Milenario', tematica: 'Star Wars', recompensa: 50, estado: 'pendiente' },
      { id: '2', nombre_set: 'Castillo de Hogwarts', tematica: 'Harry Potter', recompensa: 100, estado: 'reclamado' }
    ];
    mockOrder.mockResolvedValue({ data: mockBounties, error: null });
    
    render(<BountiesClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Star Wars')).toBeInTheDocument();
    expect(screen.getByText('Recompensa: 50 Bricks')).toBeInTheDocument();
    
    expect(screen.getByText('Castillo de Hogwarts')).toBeInTheDocument();
    expect(screen.getByText('Harry Potter')).toBeInTheDocument();
    expect(screen.getByText('Recompensa: 100 Bricks')).toBeInTheDocument();
  });

  it('debería redirigir a mesa de trabajo al hacer clic en "Aportar Set"', async () => {
    const mockBounties = [
      { id: '1', nombre_set: 'Halcón Milenario', tematica: 'Star Wars', recompensa: 50, estado: 'pendiente' }
    ];
    mockOrder.mockResolvedValue({ data: mockBounties, error: null });
    
    render(<BountiesClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    });
    
    const boton = screen.getByRole('button', { name: /Aportar Set/i });
    fireEvent.click(boton);
    
    // Verificamos que se haya llamado al router con los params adecuados
    expect(mockPush).toHaveBeenCalledWith('/mesa-de-trabajo?nombre_set=Halc%C3%B3n+Milenario&tematica=Star+Wars');
  });

  it('debería deshabilitar el botón si el bounty ya está reclamado', async () => {
    const mockBounties = [
      { id: '2', nombre_set: 'Castillo de Hogwarts', tematica: 'Harry Potter', recompensa: 100, estado: 'reclamado' }
    ];
    mockOrder.mockResolvedValue({ data: mockBounties, error: null });
    
    render(<BountiesClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Castillo de Hogwarts')).toBeInTheDocument();
    });
    
    const boton = screen.getByRole('button', { name: /Ya reclamado/i });
    expect(boton).toBeDisabled();
  });

  it('debería manejar errores de supabase sin crashear', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('Database error') });
    
    render(<BountiesClient />);
    
    // Debería mostrar "Todo limpio!" dado el fallback inicial de useState ([]) y no chocar.
    await waitFor(() => {
      expect(screen.getByText('¡Todo limpio!')).toBeInTheDocument();
    });
  });
});
