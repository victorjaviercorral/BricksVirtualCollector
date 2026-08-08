import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MesaTrabajoClient from './MesaTrabajoClient';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: vi.fn(),
}));

// Mock Image
class MockImage {
  onload?: () => void;
  onerror?: () => void;
  width = 100;
  height = 100;
  private _src = '';
  
  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    setTimeout(() => this.onload?.(), 0);
  }
}

describe('MesaTrabajoClient', () => {
  let mockGetUser: any;
  let mockSelect: any;
  let mockEq: any;
  let mockInsert: any;
  let mockUpload: any;
  let mockGetPublicUrl: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Canvas & URL mocks
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.Image = MockImage as any;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() }) as any;
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb) => {
      cb(new Blob(['mock-image-data'], { type: 'image/jpeg' }));
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    
    mockEq = vi.fn().mockResolvedValue({ data: [{ id: 'vitrina-1', nombre: 'Mi Vitrina' }] });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    
    mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'set-1' }, error: null }) }) });
    
    mockUpload = vi.fn().mockResolvedValue({ data: { path: 'file.jpg' }, error: null });
    mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'http://image.com/file.jpg' } });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'vitrinas') return { select: mockSelect };
        if (table === 'sets' || table === 'fotos') return { insert: mockInsert };
        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        })
      }
    };
    
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
    vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue(null) } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe cargar las vitrinas iniciales', async () => {
    render(<MesaTrabajoClient />);
    await waitFor(() => {
      expect(screen.getByText('Mi Vitrina')).toBeInTheDocument();
    });
  });

  it('debe mostrar error si se intenta enviar sin nombre de set', async () => {
    render(<MesaTrabajoClient />);
    await waitFor(() => {
      expect(screen.getByText('Mi Vitrina')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre del set es obligatorio.')).toBeInTheDocument();
    });
  });

  it('debe crear un set sin foto correctamente', async () => {
    render(<MesaTrabajoClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Mi Vitrina')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ej. 75192'), { target: { value: '12345' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. 7541'), { target: { value: '500' } });
    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'AT-AT' } });
    fireEvent.change(screen.getByPlaceholderText('Añade historia sobre tu set, dónde lo conseguiste, qué le falta...'), { target: { value: 'My notes' } });
    
    // Selects
    const tematicaSelect = screen.getAllByRole('combobox')[0]; // Temática is first after vitrina
    // Actually we can select by generic ways or display value if we don't want to rely on order.
    // However, vitrina is first if no vitrinaId, but since vitrina-1 is auto selected, the select is not shown (it only shows if !vitrinaId or if isLoading). Wait, the select is shown if `!vitrinaId` from URL, which is true.
    // Let's just find them by some other means if needed. For now just doing change on some comboboxes.
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Icons' } }); // tematica
    fireEvent.change(selects[2], { target: { value: 'Montado' } }); // estado

    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/vitrina-1');
    });
  });

  it('debe previsualizar la foto seleccionada y crear el set con foto', async () => {
    render(<MesaTrabajoClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Mi Vitrina')).toBeInTheDocument();
    });

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });

    // Encontramos el input file (es hidden)
    // No podemos usar getByRole por ser hidden, usamos type file o test-id. 
    // Usaremos un selector de query o label si hay. En este caso no hay label conectado con htmlFor, el div hace click.
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'X-Wing' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledTimes(2); // Una para el set, otra para la foto
      expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/vitrina-1');
    });
  });

  it('debe dar error si la imagen supera los 10MB', async () => {
    render(<MesaTrabajoClient />);
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());

    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('La imagen no debe superar los 10MB')).toBeInTheDocument();
    });
  });

  it('debe reclamar bounty si viene id en la url', async () => {
    vi.mocked(useSearchParams).mockReturnValue({ 
      get: (param: string) => param === 'bounty_id' ? 'bounty-123' : null 
    } as any);

    render(<MesaTrabajoClient />);
    
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'Tie Fighter' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/bounties/claim', expect.any(Object));
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it('debe registrar error si reclamar bounty devuelve !res.ok', async () => {
    vi.mocked(useSearchParams).mockReturnValue({ 
      get: (param: string) => param === 'bounty_id' ? 'bounty-123' : null 
    } as any);
    global.fetch = vi.fn().mockResolvedValue({ ok: false, text: vi.fn().mockResolvedValue('Bad Request') });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MesaTrabajoClient />);
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'Tie Fighter' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to claim bounty:', 'Bad Request');
    });
    consoleErrorSpy.mockRestore();
  });

  it('debe registrar error si fetch de bounty falla', async () => {
    vi.mocked(useSearchParams).mockReturnValue({ 
      get: (param: string) => param === 'bounty_id' ? 'bounty-123' : null 
    } as any);
    const mockError = new Error('Network error');
    global.fetch = vi.fn().mockRejectedValue(mockError);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MesaTrabajoClient />);
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'Tie Fighter' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error claiming bounty:', mockError);
    });
    consoleErrorSpy.mockRestore();
  });

  it('debe mostrar mensaje si el usuario no tiene vitrinas y el boton debe estar deshabilitado', async () => {
    mockEq.mockResolvedValueOnce({ data: [] });

    render(<MesaTrabajoClient />);
    
    await waitFor(() => {
      expect(screen.getByText('Para añadir un set, primero debes crear al menos una vitrina.')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /añadir set/i });
    expect(submitBtn).toBeDisabled();
  });

  it('debe atrapar error inesperado durante el guardado', async () => {
    mockInsert.mockReturnValueOnce({ 
      select: vi.fn().mockReturnValue({ 
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Database failure" } }) 
      }) 
    });

    render(<MesaTrabajoClient />);
    
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'AT-AT' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(screen.getByText('Error al crear el set: Database failure')).toBeInTheDocument();
    });
  });
});
