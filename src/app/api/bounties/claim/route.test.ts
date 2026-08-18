import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

// Mocks
const mockGetUser = vi.fn();

// sets: .select().eq().eq().single()
const mockSetSingle = vi.fn();
const mockSetEq2 = vi.fn(() => ({ single: mockSetSingle }));
const mockSetEq1 = vi.fn(() => ({ eq: mockSetEq2 }));
const mockSetSelect = vi.fn(() => ({ eq: mockSetEq1 }));

// bounties: .select().eq().single()
const mockBountySingle = vi.fn();
const mockBountyEqSelect = vi.fn(() => ({ single: mockBountySingle }));
const mockBountySelect = vi.fn(() => ({ eq: mockBountyEqSelect }));

// bounties_reclamados: .insert().select().single()
const mockClaimSingle = vi.fn();
const mockClaimInsertSelect = vi.fn(() => ({ single: mockClaimSingle }));
const mockClaimInsert = vi.fn(() => ({ select: mockClaimInsertSelect }));

const mockBricksInsert = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === 'sets') {
    return { select: mockSetSelect };
  }
  if (table === 'bounties') {
    return { select: mockBountySelect };
  }
  if (table === 'bounties_reclamados') {
    return { insert: mockClaimInsert };
  }
  if (table === 'bricks_recibidos') {
    return { insert: mockBricksInsert };
  }
  return {};
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom
  }))
}));

describe('POST /api/bounties/claim (modelo multi-reclamo, D1)', () => {
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
    // No debe llegar a comprobar ni reclamar el bounty.
    expect(mockBountySelect).not.toHaveBeenCalled();
  });

  it('la comprobación de propiedad filtra por usuario_id del solicitante', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 5 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: { id: 'r1' }, error: null });
    mockBricksInsert.mockResolvedValue({ error: null });

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

  it('debería retornar 400 si el bounty ya no está activo (cerrado por un administrador)', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'archivado' }, error: null });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Este bounty ya no está activo');
    expect(mockClaimInsert).not.toHaveBeenCalled();
  });

  // --- Regresión del hallazgo S3: atomicidad, ahora vía constraint unique(bounty_id, usuario_id) ---

  it('debería retornar 400 si el usuario ya había reclamado este bounty (23505, unique violation)', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 50 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Ya has reclamado este bounty');
    // No se conceden bricks si el reclamo no se registró.
    expect(mockBricksInsert).not.toHaveBeenCalled();
  });

  it('debería retornar 500 si falla el registro del reclamo por un motivo distinto a duplicado', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 50 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: null, error: { code: '23000', message: 'algo distinto' } });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Error al registrar el reclamo');
  });

  it('inserta el reclamo con bounty_id, usuario_id, set_id y la recompensa acotada', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'Halcón Milenario', recompensa: 5 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: { id: 'r1' }, error: null });
    mockBricksInsert.mockResolvedValue({ error: null });

    await POST(req);

    expect(mockClaimInsert).toHaveBeenCalledWith({
      bounty_id: 'b1',
      usuario_id: 'u1',
      set_id: 's1',
      nombre_set: 'Halcón Milenario',
      recompensa: 5,
      estado: 'reclamado',
    });
  });

  it('debería procesar el claim correctamente e insertar bricks', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 5 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: { id: 'r1' }, error: null });
    mockBricksInsert.mockResolvedValue({ error: null });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reward).toBe(5);
    expect(data.reclamoId).toBe('r1');

    expect(mockBricksInsert).toHaveBeenCalled();
    const insertArgs = mockBricksInsert.mock.calls[0][0];
    expect(insertArgs.length).toBe(5); // 5 bricks
    expect(insertArgs[0].set_id).toBe('s1');
    expect(insertArgs[0].hash_visitante).toContain('bounty-b1-0-');
  });

  it('un segundo usuario puede reclamar el mismo bounty que ya reclamó otro (múltiples ganadores)', async () => {
    // No hay ningún estado compartido entre reclamos de usuarios distintos: el bounty sigue
    // 'pendiente' tras el primer reclamo (ya no se bloquea), así que un segundo usuario puede
    // reclamarlo igual -- la única restricción es no poder reclamarlo dos veces LA MISMA persona
    // (probado arriba vía 23505).
    const req = createRequest({ bountyId: 'b1', setId: 's2' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u2' } } });
    mockSetSingle.mockResolvedValue({ data: { id: 's2' }, error: null });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 5 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: { id: 'r2' }, error: null });
    mockBricksInsert.mockResolvedValue({ error: null });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockClaimInsert).toHaveBeenCalledWith(expect.objectContaining({ usuario_id: 'u2', bounty_id: 'b1' }));
  });

  // --- Regresión: límite defensivo sobre la recompensa ---

  it('acota la recompensa a MAX_REWARD_BRICKS (1000) aunque el bounty pida más', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 999999 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: { id: 'r1' }, error: null });
    mockBricksInsert.mockResolvedValue({ error: null });

    const res = await POST(req);
    const data = await res.json();

    expect(data.reward).toBe(1000);
    const insertArgs = mockBricksInsert.mock.calls[0][0];
    expect(insertArgs.length).toBe(1000);
    expect(mockClaimInsert).toHaveBeenCalledWith(expect.objectContaining({ recompensa: 1000 }));
  });

  it('devuelve success igualmente si falla la inserción de bricks (el reclamo ya quedó registrado)', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockBountySingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', nombre_set: 'X', recompensa: 5 }, error: null });
    mockClaimSingle.mockResolvedValue({ data: { id: 'r1' }, error: null });
    mockBricksInsert.mockResolvedValue({ error: new Error('fallo de bricks') });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
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
