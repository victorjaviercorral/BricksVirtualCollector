import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

// Mocks
const mockGetUser = vi.fn();

// sets: .select().eq().eq().single()
const mockSetSingle = vi.fn();
const mockSetEq2 = vi.fn(() => ({ single: mockSetSingle }));
const mockSetEq1 = vi.fn(() => ({ eq: mockSetEq2 }));
const mockSetSelect = vi.fn(() => ({ eq: mockSetEq1 }));

// bounties: .select().eq().single() ; .update().eq().eq().select()
const mockBountySingle = vi.fn();
const mockBountyEqSelect = vi.fn(() => ({ single: mockBountySingle }));
const mockBountySelect = vi.fn(() => ({ eq: mockBountyEqSelect }));

const mockUpdateSelect = vi.fn(); // resuelve { data, error }
const mockUpdateEq2 = vi.fn(() => ({ select: mockUpdateSelect }));
const mockUpdateEq1 = vi.fn(() => ({ eq: mockUpdateEq2 }));
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq1 }));

const mockInsert = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === 'sets') {
    return { select: mockSetSelect };
  }
  if (table === 'bounties') {
    return { select: mockBountySelect, update: mockUpdate };
  }
  if (table === 'bricks_recibidos') {
    return { insert: mockInsert };
  }
  return {};
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom
  }))
}));

describe('POST /api/bounties/claim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto: el set SÍ pertenece al usuario (la mayoría de tests no prueban ownership).
    mockSetSingle.mockResolvedValue({ data: { id: 's1' }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (body: any) => {
    return new Request('http://localhost:3000/api/bounties/claim', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  };

  it('debería retornar 400 si faltan parámetros', async () => {
    const req = createRequest({ bountyId: 'b1' }); // Falta setId
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Faltan parámetros');
  });

  it('debería retornar 401 si el usuario no está autenticado', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('No autorizado');
  });

  // --- Regresión del hallazgo S3: verificación de propiedad del set ---

  it('debería retornar 403 si el set no pertenece al usuario que reclama', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSetSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('El set no existe o no te pertenece');
    // No debe llegar a comprobar ni actualizar el bounty.
    expect(mockBountySelect).not.toHaveBeenCalled();
  });

  it('la comprobación de propiedad filtra por usuario_id del solicitante', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 5 }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 'b1' }], error: null });
    mockInsert.mockResolvedValue({ error: null });

    await POST(req);

    expect(mockSetSelect).toHaveBeenCalled();
    expect(mockSetEq1).toHaveBeenCalledWith('id', 's1');
    expect(mockSetEq2).toHaveBeenCalledWith('usuario_id', 'u1');
  });

  it('debería retornar 404 si el bounty no existe', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Bounty no encontrado');
  });

  it('debería retornar 400 si el bounty ya no está pendiente', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'reclamado' }, error: null });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('El bounty ya fue reclamado');
  });

  it('debería retornar 500 si falla la actualización del bounty', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 50 }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: null, error: new Error('Update failed') });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Error al actualizar el bounty');
  });

  // --- Regresión del hallazgo S3: atomicidad (condición de carrera) ---

  it('debería retornar 400 si el UPDATE condicional no afecta a ninguna fila (otra petición ganó la carrera)', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 50 }, error: null });
    // Update condicional (.eq('estado','pendiente')) no afecta ninguna fila: ya lo reclamó otro.
    mockUpdateSelect.mockResolvedValue({ data: [], error: null });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('El bounty ya fue reclamado');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('el UPDATE condiciona por id Y por estado=pendiente', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 5 }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 'b1' }], error: null });
    mockInsert.mockResolvedValue({ error: null });

    await POST(req);

    expect(mockUpdateEq1).toHaveBeenCalledWith('id', 'b1');
    expect(mockUpdateEq2).toHaveBeenCalledWith('estado', 'pendiente');
  });

  it('debería procesar el claim correctamente e insertar bricks', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 5 }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 'b1' }], error: null });
    mockInsert.mockResolvedValue({ error: null });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reward).toBe(5);

    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'reclamado', reclamado_por: 'u1' });
    expect(mockInsert).toHaveBeenCalled();
    const insertArgs = mockInsert.mock.calls[0][0];
    expect(insertArgs.length).toBe(5); // 5 bricks
    expect(insertArgs[0].set_id).toBe('s1');
    expect(insertArgs[0].hash_visitante).toContain('bounty-b1-0-');
  });

  // --- Regresión: límite defensivo sobre la recompensa ---

  it('acota la recompensa a MAX_REWARD_BRICKS (1000) aunque el bounty pida más', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 999999 }, error: null });
    mockUpdateSelect.mockResolvedValue({ data: [{ id: 'b1' }], error: null });
    mockInsert.mockResolvedValue({ error: null });

    const res = await POST(req);
    const data = await res.json();

    expect(data.reward).toBe(1000);
    const insertArgs = mockInsert.mock.calls[0][0];
    expect(insertArgs.length).toBe(1000);
  });

  it('debería retornar 500 si hay un error general no controlado', async () => {
    // Forzamos un error rompiendo el request JSON
    const req = { json: () => Promise.reject(new Error('Bad JSON')) } as any;

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Error interno del servidor');
  });
});
