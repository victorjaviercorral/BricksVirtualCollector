import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VitrinaClient from './VitrinaClient';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('VitrinaClient', () => {
  let mockSupabase: any;
  const mockId = 'v123';

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn().mockImplementation((table) => {
        if (table === 'vitrinas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ 
              data: { id: mockId, nombre: 'Castle', descripcion: 'Old sets', usuarios_perfil: { username: 'Knight' } },
              error: null
            })
          };
        }
        if (table === 'sets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ 
              data: [
                { id: 'set1', nombre: 'Castle 1', tematica: 'castle', num_piezas: 100, bricks_recibidos: [{ count: 5 }], fotos: [{ url: 'img1.png' }] },
                { id: 'set2', nombre: 'Castle 2', tematica: 'castle', num_piezas: 200, bricks_recibidos: null, fotos: null }
              ],
              error: null
            })
          };
        }
        return { select: vi.fn().mockReturnThis() };
      })
    };
    (createClient as any).mockReturnValue(mockSupabase);
    
    // Mock global fetch for handleGiveBrick
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  it('muestra el loader inicialmente', () => {
    const { container } = render(<VitrinaClient id={mockId} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra mensaje de no encontrada si falla la carga', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
    }));
    
    render(<VitrinaClient id={mockId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Vitrina no encontrada')).toBeInTheDocument();
    });
  });

  it('carga y muestra la vitrina y los sets', async () => {
    render(<VitrinaClient id={mockId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Castle')).toBeInTheDocument();
      expect(screen.getByText('Knight')).toBeInTheDocument(); // username
      expect(screen.getByText('Castle 1')).toBeInTheDocument();
      expect(screen.getByText('Castle 2')).toBeInTheDocument();
      expect(screen.getByText('5 Bricks')).toBeInTheDocument();
    });
  });

  it('permite dar like (dar brick) de forma optimista', async () => {
    render(<VitrinaClient id={mockId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Castle 1')).toBeInTheDocument();
    });

    const brickBtn = screen.getByText('5 Bricks', { selector: 'button' });
    fireEvent.click(brickBtn);

    // Optimistic update
    expect(screen.getByText('6 Bricks')).toBeInTheDocument();
    expect(brickBtn).toBeDisabled();

    // Call fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bricks', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ set_id: 'set1' })
      }));
    });
  });

  it('revierte el like si la llamada falla', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'DB Fail' })
    });

    render(<VitrinaClient id={mockId} />);
    
    await waitFor(() => {
      expect(screen.getByText('Castle 1')).toBeInTheDocument();
    });

    const brickBtn = screen.getByText('5 Bricks', { selector: 'button' });
    fireEvent.click(brickBtn);

    // Optimistic
    expect(screen.getByText('6 Bricks')).toBeInTheDocument();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('DB Fail');
      // Reverted
      expect(screen.getByText('5 Bricks')).toBeInTheDocument();
      expect(brickBtn).not.toBeDisabled();
    });
  });
});
