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

  // Reparto de insignias al archivar (hallazgo D3): exposicion_sets -> bricks_recibidos ->
  // sets_insignias.upsert(), cada tabla con su propia cadena de mocks, distinguidas por nombre
  // de tabla en mockFrom.mockImplementation.
  const mockExpoSetsEq2 = vi.fn();
  const mockExpoSetsEq1 = vi.fn(() => ({ eq: mockExpoSetsEq2 }));
  const mockExpoSetsSelect = vi.fn(() => ({ eq: mockExpoSetsEq1 }));

  const mockBricksIn = vi.fn();
  const mockBricksEq = vi.fn(() => ({ in: mockBricksIn }));
  const mockBricksSelect = vi.fn(() => ({ eq: mockBricksEq }));

  const mockInsigniasUpsert = vi.fn();

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

    mockFrom.mockImplementation((table: string) => {
      if (table === 'exposicion_sets') return { select: mockExpoSetsSelect };
      if (table === 'bricks_recibidos') return { select: mockBricksSelect };
      if (table === 'sets_insignias') return { upsert: mockInsigniasUpsert };
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: vi.fn(),
      };
    });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockUpdate.mockReturnValue({ eq: mockEq, neq: mockNeq });

    mockEq.mockResolvedValue({ error: null });
    mockNeq.mockResolvedValue({ error: null });

    // Por defecto: exposición sin participantes aprobados -- el flujo de archivar salta
    // directamente al UPDATE de estado, igual que antes de esta ronda (comportamiento por
    // defecto de los tests existentes que no prueban el reparto de insignias).
    mockExpoSetsEq2.mockResolvedValue({ data: [], error: null });
    mockBricksIn.mockResolvedValue({ data: [], error: null });
    mockInsigniasUpsert.mockResolvedValue({ error: null });
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

  it('debe archivar exposición sin participantes aprobados (no reparte insignias)', async () => {
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
      expect(mockExpoSetsSelect).toHaveBeenCalledWith('set_id');
      expect(mockExpoSetsEq1).toHaveBeenCalledWith('exposicion_id', 'expo-1');
      expect(mockExpoSetsEq2).toHaveBeenCalledWith('estado', 'aprobado');
      // Sin participantes: no se llega a calcular bricks ni a repartir insignias.
      expect(mockBricksSelect).not.toHaveBeenCalled();
      expect(mockInsigniasUpsert).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'archivada' });
      expect(mockEq).toHaveBeenCalledWith('id', 'expo-1');
      expect(toast.success).toHaveBeenCalledWith('Exposición archivada. No hubo participantes aprobados.');
    });
  });

  // --- Hallazgo D3: reparto real de insignias al archivar ---

  it('reparte insignias según el ranking de bricks al archivar con participantes', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa' }]
    });
    mockExpoSetsEq2.mockResolvedValue({ data: [{ set_id: 's1' }, { set_id: 's2' }], error: null });
    // s1 recibe 2 bricks dentro de esta exposición, s2 recibe 1 -> s1 debe quedar 1º.
    mockBricksIn.mockResolvedValue({ data: [{ set_id: 's1' }, { set_id: 's1' }, { set_id: 's2' }], error: null });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
      expect(mockBricksSelect).toHaveBeenCalledWith('set_id');
      expect(mockBricksEq).toHaveBeenCalledWith('exposicion_id', 'expo-1');
      expect(mockBricksIn).toHaveBeenCalledWith('set_id', ['s1', 's2']);

      expect(mockInsigniasUpsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({ set_id: 's1', exposicion_id: 'expo-1', rango: 1, titulo_insignia: '🥇 1er Puesto' }),
          expect.objectContaining({ set_id: 's2', exposicion_id: 'expo-1', rango: 2, titulo_insignia: '🥈 2º Puesto' }),
        ],
        { onConflict: 'set_id,exposicion_id' }
      );

      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'archivada' });
      expect(toast.success).toHaveBeenCalledWith('Exposición archivada. Insignias entregadas a 2 participante(s).');
    });
  });

  it('no archiva si falla el cálculo de participaciones aprobadas', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa' }]
    });
    mockExpoSetsEq2.mockResolvedValue({ data: null, error: new Error('fallo') });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al calcular el ranking de la exposición');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  it('no archiva si falla el recuento de bricks', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa' }]
    });
    mockExpoSetsEq2.mockResolvedValue({ data: [{ set_id: 's1' }], error: null });
    mockBricksIn.mockResolvedValue({ data: null, error: new Error('fallo') });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al calcular el ranking de la exposición');
      expect(mockInsigniasUpsert).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  it('no archiva si falla el reparto de insignias (para poder reintentar sin dejarlo a medias)', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa' }]
    });
    mockExpoSetsEq2.mockResolvedValue({ data: [{ set_id: 's1' }], error: null });
    mockBricksIn.mockResolvedValue({ data: [{ set_id: 's1' }], error: null });
    mockInsigniasUpsert.mockResolvedValue({ error: new Error('fallo de RLS') });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al repartir las insignias');
      expect(mockUpdate).not.toHaveBeenCalled();
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
