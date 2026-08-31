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

describe('MesaTrabajoClient', () => {
  let mockGetUser: any;
  let mockSelect: any;
  let mockEq: any;
  let mockInsert: any;

  // ADR-005/ADR-010 (hallazgo S2): la limpieza EXIF ya no ocurre en el navegador
  // (canvas.toBlob()) -- ahora la foto en crudo se envía a /api/sets/foto, que la limpia con
  // sharp server-side. fetch() distingue por URL entre ese endpoint y el de reclamar bounty,
  // igual que hace el propio componente.
  const mockFetch = (url: string, init?: RequestInit) => {
    if (typeof url === 'string' && url.includes('/api/sets/foto')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, url: 'http://image.com/file.jpg' }),
      });
    }
    return Promise.resolve({ ok: true, text: () => Promise.resolve('') });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.fetch = vi.fn().mockImplementation(mockFetch) as any;

    mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });

    mockEq = vi.fn().mockResolvedValue({ data: [{ id: 'vitrina-1', nombre: 'Mi Vitrina' }] });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'set-1' }, error: null }) }) });

    const mockSupabase = {
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'vitrinas') return { select: mockSelect };
        if (table === 'sets' || table === 'fotos') return { insert: mockInsert };
        return {};
      }),
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

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'Icons' } }); // tematica
    fireEvent.change(selects[2], { target: { value: 'Montado' } }); // estado

    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/vitrina-1');
    });

    // Sin foto, no debe llamarse al endpoint de limpieza EXIF.
    expect(global.fetch).not.toHaveBeenCalledWith('/api/sets/foto', expect.any(Object));
  });

  it('debe previsualizar la foto seleccionada, subirla vía /api/sets/foto (limpieza EXIF server-side) y crear el set con foto', async () => {
    render(<MesaTrabajoClient />);

    await waitFor(() => {
      expect(screen.getByText('Mi Vitrina')).toBeInTheDocument();
    });

    const file = new File([new Uint8Array(5 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'X-Wing' } });

    // Mientras se sube, el botón avisa específicamente de la limpieza, no un "Guardando..." genérico.
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));
    await waitFor(() => {
      expect(screen.getByText('Protegiendo tu foto...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sets/foto', expect.objectContaining({ method: 'POST' }));
      expect(mockInsert).toHaveBeenCalledTimes(2); // Una para el set, otra para la foto
      expect(mockPush).toHaveBeenCalledWith('/dashboard/vitrina/vitrina-1');
    });
  });

  it('propaga el error si /api/sets/foto responde con !ok (ej. imagen inválida o demasiado grande)', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sets/foto')) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'La imagen no debe superar los 10MB' }) });
      }
      return mockFetch(url);
    }) as any;

    render(<MesaTrabajoClient />);
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());

    const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByAltText('Preview')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'X-Wing' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => {
      expect(screen.getByText('La imagen no debe superar los 10MB')).toBeInTheDocument();
    });
    // No debe haber creado el set si la foto falló en subir.
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('avisa antes de cerrar/recargar la pestaña mientras una subida está en curso', async () => {
    // fetch que no resuelve nunca durante la ventana de la prueba -- simula una subida en curso.
    let resolveUpload: (value: unknown) => void = () => {};
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/sets/foto')) {
        return new Promise((resolve) => { resolveUpload = resolve; });
      }
      return mockFetch(url);
    }) as any;

    render(<MesaTrabajoClient />);
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());

    const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByAltText('Preview')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Halcón Milenario UCS'), { target: { value: 'X-Wing' } });
    fireEvent.click(screen.getByRole('button', { name: /añadir set/i }));

    await waitFor(() => expect(screen.getByText('Protegiendo tu foto...')).toBeInTheDocument());

    const event = new Event('beforeunload', { cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();

    // Limpieza: deja resolver la subida pendiente para no dejar un timer/promise colgando.
    resolveUpload({ ok: true, json: () => Promise.resolve({ success: true, url: 'http://image.com/file.jpg' }) });
  });

  it('debe dar error si la imagen supera los 10MB (comprobación del cliente, antes de llamar al servidor)', async () => {
    render(<MesaTrabajoClient />);
    await waitFor(() => expect(screen.getByText('Mi Vitrina')).toBeInTheDocument());

    const file = new File([new Uint8Array(11 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('La imagen no debe superar los 10MB')).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
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
