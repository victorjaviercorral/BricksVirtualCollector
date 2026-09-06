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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className} data-testid="motion-div">{children}</div>
  }
}));

/**
 * Reescrito para H5 (docs/05-plan/plan-intervencion-post-iteracion-3.md). El componente ahora:
 * (a) carga dos consultas agregadas en fetchExposiciones (participantes aprobados y bricks por
 *     exposición) para el resumen inline de cada tarjeta,
 * (b) tiene un filtro activas/archivadas (por defecto "activas"), así que los tests de
 *     exposiciones archivadas cambian de pestaña primero,
 * (c) sustituye "No hay exposiciones creadas." por textos por pestaña.
 * Los intents de los tests previos (validación de creación, reparto de insignias al archivar,
 * reactivar) se conservan íntegros; solo cambia el andamiaje de mocks y la navegación de pestaña.
 */
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
  // sets_insignias.upsert().
  const mockExpoSetsEq2 = vi.fn();
  const mockExpoSetsEq1 = vi.fn(() => ({ eq: mockExpoSetsEq2 }));

  const mockBricksIn = vi.fn();
  const mockBricksEq = vi.fn(() => ({ in: mockBricksIn }));

  const mockInsigniasUpsert = vi.fn();

  // Consultas agregadas de H5 (resumen inline): dependen del argumento de .select().
  const mockAprobadosAgg = vi.fn();   // exposicion_sets.select('exposicion_id').eq('estado','aprobado')
  const mockBricksAgg = vi.fn();      // bricks_recibidos.select('exposicion_id')

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
      if (table === 'exposicion_sets') {
        return {
          select: (cols: string) =>
            cols === 'exposicion_id'
              ? { eq: mockAprobadosAgg }                       // resumen inline
              : { eq: mockExpoSetsEq1 },                       // reparto de insignias
        };
      }
      if (table === 'bricks_recibidos') {
        return {
          select: (cols: string) =>
            cols === 'exposicion_id'
              ? Promise.resolve({ data: mockBricksAgg() })     // resumen inline (await directo)
              : { eq: mockBricksEq },                          // reparto de insignias
        };
      }
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

    // Por defecto: sin participantes / sin bricks.
    mockExpoSetsEq2.mockResolvedValue({ data: [], error: null });
    mockBricksIn.mockResolvedValue({ data: [], error: null });
    mockInsigniasUpsert.mockResolvedValue({ error: null });
    mockAprobadosAgg.mockResolvedValue({ data: [] });
    mockBricksAgg.mockReturnValue([]);
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

  it('muestra el resumen inline de participantes y bricks por exposición', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
    });
    mockAprobadosAgg.mockResolvedValue({ data: [{ exposicion_id: 'expo-1' }, { exposicion_id: 'expo-1' }] });
    mockBricksAgg.mockReturnValue([{ exposicion_id: 'expo-1' }, { exposicion_id: 'expo-1' }, { exposicion_id: 'expo-1' }]);

    render(<AdminExposiciones />);

    await waitFor(() => {
      expect(screen.getByText('2 participantes aprobados')).toBeInTheDocument();
      expect(screen.getByText('3 bricks')).toBeInTheDocument();
    });
  });

  it('una exposición con exactamente 1 participante usa el singular', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Con Uno', estado: 'activa', es_continua: true }]
    });
    mockAprobadosAgg.mockResolvedValue({ data: [{ exposicion_id: 'expo-1' }] });
    mockBricksAgg.mockReturnValue([{ exposicion_id: 'expo-1' }]);
    render(<AdminExposiciones />);
    await waitFor(() => {
      expect(screen.getByText('1 participante aprobado')).toBeInTheDocument();
      expect(screen.getByText('1 brick')).toBeInTheDocument();
    });
  });

  it('una exposición sin fila de resumen cae a cero, no rompe', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Sin Resumen', estado: 'activa', es_continua: true }]
    });
    mockAprobadosAgg.mockResolvedValue({ data: null });
    mockBricksAgg.mockReturnValue(null);
    render(<AdminExposiciones />);
    await waitFor(() => {
      expect(screen.getByText('0 participantes aprobados')).toBeInTheDocument();
    });
  });

  it('cada tarjeta enlaza a la ficha pública /exposicion/[id]', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
    });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    const link = screen.getByRole('link', { name: /ver ficha pública/i });
    expect(link).toHaveAttribute('href', '/exposicion/expo-1');
  });

  it('el filtro separa activas de archivadas', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { id: 'e-act', titulo: 'La Activa', estado: 'activa', es_continua: true },
        { id: 'e-arch', titulo: 'La Archivada', estado: 'archivada', es_continua: true },
      ]
    });
    render(<AdminExposiciones />);

    await waitFor(() => expect(screen.getByText('La Activa')).toBeInTheDocument());
    expect(screen.queryByText('La Archivada')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /archivadas/i }));

    expect(screen.getByText('La Archivada')).toBeInTheDocument();
    expect(screen.queryByText('La Activa')).not.toBeInTheDocument();
  });

  it('muestra "Fechas por definir" cuando las fechas son null, nunca 1/1/1970', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Sin fechas', estado: 'activa', es_continua: false, fecha_inicio: null, fecha_fin: null }]
    });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Sin fechas')).toBeInTheDocument());
    expect(screen.getByText('Fechas por definir')).toBeInTheDocument();
    expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
  });

  it('debe mostrar error si se intenta crear sin foto', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    render(<AdminExposiciones />);

    await waitFor(() => expect(screen.getByText('No hay exposiciones activas.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));

    const submitBtn = screen.getAllByRole('button', { name: /crear evento/i }).find(b => b.getAttribute('type') === 'submit');
    fireEvent.submit(submitBtn!.closest('form')!);

    expect(toast.error).toHaveBeenCalledWith('Selecciona una imagen de portada');
  });

  it('debe mostrar error si faltan fechas en no continua', async () => {
    mockOrder.mockResolvedValue({ data: [] });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('No hay exposiciones activas.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /crear evento/i }));

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
    await waitFor(() => expect(screen.getByText('No hay exposiciones activas.')).toBeInTheDocument());

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
    await waitFor(() => expect(screen.getByText('No hay exposiciones activas.')).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText('No hay exposiciones activas.')).toBeInTheDocument());
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
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
    });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
      expect(mockExpoSetsEq1).toHaveBeenCalledWith('exposicion_id', 'expo-1');
      expect(mockExpoSetsEq2).toHaveBeenCalledWith('estado', 'aprobado');
      expect(mockInsigniasUpsert).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'archivada' });
      expect(mockEq).toHaveBeenCalledWith('id', 'expo-1');
      expect(toast.success).toHaveBeenCalledWith('Exposición archivada. No hubo participantes aprobados.');
    });
  });

  it('reparte insignias según el ranking de bricks al archivar con participantes', async () => {
    mockOrder.mockResolvedValue({
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
    });
    mockExpoSetsEq2.mockResolvedValue({ data: [{ set_id: 's1' }, { set_id: 's2' }], error: null });
    mockBricksIn.mockResolvedValue({ data: [{ set_id: 's1' }, { set_id: 's1' }, { set_id: 's2' }], error: null });

    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByText('Exposición Activa')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /finalizar y entregar insignias/i }));

    await waitFor(() => {
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
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
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
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
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
      data: [{ id: 'expo-1', titulo: 'Exposición Activa', estado: 'activa', es_continua: true }]
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
        es_continua: true,
      }]
    });
    render(<AdminExposiciones />);
    await waitFor(() => expect(screen.getByRole('button', { name: /archivadas/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /archivadas/i }));
    await waitFor(() => expect(screen.getByText('Exposición Archivada')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /reactivar/i }));

    await waitFor(() => {
      expect(mockNeq).toHaveBeenCalledWith('id', '00000000-0000-0000-0000-000000000000');
      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'activa' });
      expect(mockEq).toHaveBeenCalledWith('id', 'expo-2');
    });
  });
});
