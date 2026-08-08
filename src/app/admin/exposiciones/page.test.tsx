import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminExposiciones from './page';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  }
}));

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className} data-testid="motion-div">{children}</div>
  }
}));

describe('Admin Exposiciones', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockOrder = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockNeq = vi.fn();
  const mockUpload = vi.fn();
  const mockGetPublicUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(createClient).mockReturnValue({
      from: mockFrom,
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl
        })
      }
    } as any);

    mockFrom.mockReturnValue({ 
      select: mockSelect, 
      insert: mockInsert, 
      update: mockUpdate,
      delete: vi.fn()
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockUpdate.mockReturnValue({ eq: mockEq, neq: mockNeq });
    
    mockEq.mockResolvedValue({ error: null });
    mockNeq.mockResolvedValue({ error: null });
  });

  it('debe cargar la lista de exposiciones', async () => {
    mockOrder.mockResolvedValue({ 
      data: [{
        id: 'expo-1',
        titulo: 'Exposición Activa',
        descripcion: 'Desc 1',
        estado: 'activa',
        es_continua: true,
        imagen_url: 'http://img.com/1.jpg'
      }]
    });

    render(<AdminExposiciones />);
    
    expect(screen.getByText('Cargando exposiciones...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Exposición Activa')).toBeInTheDocument();
      expect(screen.getByText('ACTIVA')).toBeInTheDocument();
    });
  });

  it('debe mostrar error si se intenta crear sin foto', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    render(<AdminExposiciones />);
    
    await waitFor(() => expect(screen.getByText('No hay exposiciones creadas.')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    
    const submitBtn = screen.getAllByRole('button', { name: /crear evento/i }).find(b => b.getAttribute('type') === 'submit');
    fireEvent.submit(submitBtn!.closest('form')!);

    expect(toast.error).toHaveBeenCalledWith('Selecciona una imagen de portada');
  });

  it('debe mostrar error si faltan fechas en no continua', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('No hay exposiciones creadas.')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    
    // Simulate file input
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/imagen de portada/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getAllByRole('button', { name: /crear evento/i }).find(b => b.getAttribute('type') === 'submit');
    fireEvent.submit(submitBtn!.closest('form')!);

    expect(toast.error).toHaveBeenCalledWith('Debes definir las fechas o marcarla como continua');
  });

  it('debe crear evento continuo correctamente', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://url' } });
    mockInsert.mockResolvedValue({ error: null });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('No hay exposiciones creadas.')).toBeInTheDocument());
    
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Nuevo Título' } });
    fireEvent.change(screen.getByLabelText(/descripción corta/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText(/requisitos/i), { target: { value: 'Reqs' } });
    
    fireEvent.click(screen.getByLabelText(/exposición continua/i));
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/imagen de portada/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getAllByRole('button', { name: /crear evento/i }).find(b => b.getAttribute('type') === 'submit');
    fireEvent.submit(submitBtn!.closest('form')!);

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
      expect(mockNeq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000');
      expect(mockInsert).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Exposición publicada correctamente');
    });
  });

  it('debe atrapar error al subir la imagen', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    mockUpload.mockResolvedValue({ error: new Error('Upload error') });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('No hay exposiciones creadas.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    
    fireEvent.click(screen.getByLabelText(/exposición continua/i));
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Nuevo Título' } });
    fireEvent.change(screen.getByLabelText(/descripción corta/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText(/requisitos/i), { target: { value: 'Reqs' } });
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/imagen de portada/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getAllByRole('button', { name: /crear evento/i }).find(b => b.getAttribute('type') === 'submit');
    fireEvent.submit(submitBtn!.closest('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al subir la imagen');
    });
  });

  it('debe atrapar error al insertar la exposicion', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://url' } });
    mockInsert.mockResolvedValue({ error: new Error('Insert error') });
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('No hay exposiciones creadas.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));
    
    fireEvent.click(screen.getByLabelText(/exposición continua/i));
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Nuevo Título' } });
    fireEvent.change(screen.getByLabelText(/descripción corta/i), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText(/requisitos/i), { target: { value: 'Reqs' } });
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/imagen de portada/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = screen.getAllByRole('button', { name: /crear evento/i }).find(b => b.getAttribute('type') === 'submit');
    fireEvent.submit(submitBtn!.closest('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al crear la exposición');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    consoleErrorSpy.mockRestore();
  });

  it('debe archivar exposición', async () => {
    mockOrder.mockResolvedValue({ 
      data: [{
        id: 'expo-1',
        titulo: 'Exposición Activa',
        estado: 'activa',
      }]
    });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'archivada' });
      expect(mockEq).toHaveBeenCalledWith('id', 'expo-1');
    });
  });

  it('debe reactivar exposición', async () => {
    mockOrder.mockResolvedValue({ 
      data: [{
        id: 'expo-2',
        titulo: 'Exposición Archivada',
        estado: 'archivada',
      }]
    });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Archivada')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reactivar/i }));

    await waitFor(() => {
      expect(mockNeq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000');
      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'activa' });
      expect(mockEq).toHaveBeenCalledWith('id', 'expo-2');
    });
  });
});
