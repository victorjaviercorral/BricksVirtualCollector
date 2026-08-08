import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BountiesSectionClient from './BountiesSectionClient';
import { toast } from 'sonner';

// Mocks
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh
  })
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const mockGetUser = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom
  }))
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('BountiesSectionClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockBounties = [
    { id: 'b1', nombre_set: 'Halcón Milenario', recompensa: 50 }
  ];

  it('debería mostrar mensaje si no hay bounties', () => {
    render(<BountiesSectionClient bounties={[]} />);
    expect(screen.getByText('No hay bounties activos ahora mismo.')).toBeInTheDocument();
  });

  it('debería renderizar la lista de bounties', () => {
    render(<BountiesSectionClient bounties={mockBounties} />);
    expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    expect(screen.getByText('+50 pts')).toBeInTheDocument();
  });

  it('debería redirigir a login si intenta reclamar sin estar logueado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    
    render(<BountiesSectionClient bounties={mockBounties} />);
    fireEvent.click(screen.getByRole('button', { name: /Reclamar Misión/i }));
    
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });
    
    expect(toast.error).toHaveBeenCalledWith('Debes iniciar sesión para reclamar Bounties');
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('debería abrir el modal y cargar los sets del usuario si está logueado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const mockSets = [
      { id: 's1', nombre: 'Set de Prueba 1', fotos: [{ url: 'foto.jpg' }] },
      { id: 's2', nombre: 'Set de Prueba 2', fotos: [] }
    ];
    mockEq.mockResolvedValue({ data: mockSets });
    
    render(<BountiesSectionClient bounties={mockBounties} />);
    fireEvent.click(screen.getByRole('button', { name: /Reclamar Misión/i }));
    
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('sets');
      expect(screen.getByText('Reclamar Bounty')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Misión actual:')).toBeInTheDocument();
    expect(screen.getByText('Set de Prueba 1')).toBeInTheDocument();
    expect(screen.getByText('Set de Prueba 2')).toBeInTheDocument();
  });

  it('debería mostrar mensaje si el usuario no tiene sets', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockEq.mockResolvedValue({ data: [] }); // Sin sets
    
    render(<BountiesSectionClient bounties={mockBounties} />);
    fireEvent.click(screen.getByRole('button', { name: /Reclamar Misión/i }));
    
    await waitFor(() => {
      expect(screen.getByText('No tienes sets subidos aún.')).toBeInTheDocument();
    });
  });

  it('debería permitir seleccionar un set y realizar claim directo exitoso', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const mockSets = [{ id: 's1', nombre: 'Set de Prueba 1', fotos: [{ url: 'foto.jpg' }] }];
    mockEq.mockResolvedValue({ data: mockSets });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, reward: 50 })
    });
    
    render(<BountiesSectionClient bounties={mockBounties} />);
    
    // Abrimos modal
    fireEvent.click(screen.getByRole('button', { name: /Reclamar Misión/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Set de Prueba 1')).toBeInTheDocument();
    });
    
    // Seleccionamos set
    fireEvent.click(screen.getByText('Set de Prueba 1'));
    
    // Click en cobrar recompensa
    const botonCobrar = screen.getByRole('button', { name: /Cobrar Recompensa Directa/i });
    expect(botonCobrar).not.toBeDisabled();
    fireEvent.click(botonCobrar);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/bounties/claim', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ bountyId: 'b1', setId: 's1' })
      }));
    });
    
    expect(toast.success).toHaveBeenCalledWith('¡Bounty reclamado con éxito! Puntos añadidos.');
    expect(mockRefresh).toHaveBeenCalled();
    // Modal debería cerrarse
    expect(screen.queryByText('Reclamar Bounty')).not.toBeInTheDocument();
  });

  it('debería mostrar error en toast si la api de claim falla', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    const mockSets = [{ id: 's1', nombre: 'Set de Prueba 1', fotos: [{ url: 'foto.jpg' }] }];
    mockEq.mockResolvedValue({ data: mockSets });
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'El bounty ya fue reclamado' })
    });
    
    render(<BountiesSectionClient bounties={mockBounties} />);
    
    // Abrimos modal
    fireEvent.click(screen.getByRole('button', { name: /Reclamar Misión/i }));
    await waitFor(() => {
      expect(screen.getByText('Set de Prueba 1')).toBeInTheDocument();
    });
    
    // Seleccionamos set y cobramos
    fireEvent.click(screen.getByText('Set de Prueba 1'));
    fireEvent.click(screen.getByRole('button', { name: /Cobrar Recompensa Directa/i }));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El bounty ya fue reclamado');
    });
    // El modal no se cierra si hay error
    expect(screen.getByText('Reclamar Bounty')).toBeInTheDocument();
  });

  it('debería cerrar el modal al pulsar la X', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockEq.mockResolvedValue({ data: [] });
    
    render(<BountiesSectionClient bounties={mockBounties} />);
    fireEvent.click(screen.getByRole('button', { name: /Reclamar Misión/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Reclamar Bounty')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('X'));
    expect(screen.queryByText('Reclamar Bounty')).not.toBeInTheDocument();
  });
});
