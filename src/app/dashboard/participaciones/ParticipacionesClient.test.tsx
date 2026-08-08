import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParticipacionesClient from './ParticipacionesClient';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('ParticipacionesClient', () => {
  const mockRefresh = vi.fn();
  let mockSupabase: any;

  const mockMisExposiciones = [
    {
      id: 'e1',
      estado: 'aprobado',
      exposiciones_temporales: { titulo: 'Expo 1', imagen_url: 'img1.png', estado: 'activa' },
      sets: { id: 's1', nombre: 'Set 1' }
    }
  ];

  const mockMisBounties = [
    { id: 'b1', nombre_set: 'Bounty 1', recompensa: 100, creado_en: '2023-01-01' }
  ];

  const mockMisInsignias = [
    { id: 'i1', titulo_insignia: 'Gold', rango: 1, exposiciones_temporales: { titulo: 'Expo 1' } }
  ];

  const mockExposActivas = [
    { id: 'ea1', titulo: 'Expo Activa 1', descripcion: 'Desc 1' }
  ];

  const mockBountiesActivos = [
    { id: 'ba1', nombre_set: 'Active Bounty 1', recompensa: 50 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ refresh: mockRefresh });
    
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    };
    (createClient as any).mockReturnValue(mockSupabase);
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('renderiza correctamente las tabs iniciales y exposiciones', () => {
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);
    
    expect(screen.getByText('Mi Historial Gamificado')).toBeInTheDocument();
    expect(screen.getByText('Expo 1')).toBeInTheDocument();
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Expo Activa 1')).toBeInTheDocument();
  });

  it('cambia a tab de bounties', () => {
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);
    
    fireEvent.click(screen.getByText('bounties'));
    expect(screen.getByText('Bounty 1')).toBeInTheDocument();
    expect(screen.getByText('+100 pts')).toBeInTheDocument();
  });

  it('cambia a tab de insignias', () => {
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);
    
    fireEvent.click(screen.getByText('insignias'));
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('permite retirar un set de una exposicion si esta confirmada y activa', async () => {
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);

    const withdrawBtn = screen.getByText(/Retirar Set/i);
    fireEvent.click(withdrawBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('exposicion_sets');
      expect(toast.success).toHaveBeenCalledWith('Participación retirada con éxito');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('no retira si el usuario cancela', async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);

    const withdrawBtn = screen.getByText(/Retirar Set/i);
    fireEvent.click(withdrawBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('muestra error si retirar falla', async () => {
    mockSupabase.from().delete().eq.mockResolvedValueOnce({ error: { message: 'DB Fail' } });
    
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);

    const withdrawBtn = screen.getByText(/Retirar Set/i);
    fireEvent.click(withdrawBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al retirar la participación');
    });
    });

  it('permite cambiar a la pestaña de bounties e insignias', async () => {
    render(<ParticipacionesClient 
      misExposiciones={mockMisExposiciones}
      misBounties={mockMisBounties}
      misInsignias={mockMisInsignias}
      exposActivas={mockExposActivas}
      bountiesActivos={mockBountiesActivos}
    />);
    
    // Bounties
    fireEvent.click(screen.getByText('bounties'));
    expect(screen.getByText('Bounty 1')).toBeInTheDocument();
    
    // Insignias
    fireEvent.click(screen.getByText('insignias'));
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('renderiza estados vacios de bounties e insignias', async () => {
    render(<ParticipacionesClient 
      misExposiciones={[]}
      misBounties={[]}
      misInsignias={[]}
      exposActivas={[]}
      bountiesActivos={[]}
    />);
    
    fireEvent.click(screen.getByText('bounties'));
    expect(screen.getByText('No has reclamado ningún bounty todavía.')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('insignias'));
    expect(screen.getByText('Aún no tienes insignias. ¡Participa en exposiciones para conseguirlas!')).toBeInTheDocument();
  });

  it('cubre ramas de UI para recomendaciones vacias y estado de participaciones pendiente/rechazado', async () => {
    render(<ParticipacionesClient 
      misExposiciones={[
        {
          id: 'exp1',
          estado: 'pendiente',
          exposiciones_temporales: { titulo: 'Expo 1', imagen_url: 'img1.jpg', estado: 'inactiva' },
          sets: { id: 's1', nombre: 'Set A' }
        },
        {
          id: 'exp2',
          estado: 'rechazado',
          exposiciones_temporales: { titulo: 'Expo 2', imagen_url: 'img2.jpg', estado: 'inactiva' },
          sets: { id: 's2', nombre: 'Set C' }
        }
      ]}
      misBounties={[]}
      misInsignias={[
        { id: 'i1', titulo_insignia: 'Oro', rango: 1, exposiciones_temporales: { titulo: 'Expo 1' } },
        { id: 'i2', titulo_insignia: 'Bronce', rango: 3, exposiciones_temporales: { titulo: 'Expo 1' } }
      ]}
      exposActivas={[]}
      bountiesActivos={[]}
    />);

    expect(screen.getByText('No hay exposiciones activas en este momento.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('insignias'));
    expect(screen.getByText('Oro')).toBeInTheDocument();
    expect(screen.getByText('Bronce')).toBeInTheDocument();
  });
});
