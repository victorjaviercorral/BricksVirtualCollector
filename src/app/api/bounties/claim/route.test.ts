import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

// Mocks
const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockEqSelect = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEqSelect }));
const mockEqUpdate = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockEqUpdate }));
const mockInsert = vi.fn();
const mockFrom = vi.fn((table: string) => {
  if (table === 'bounties') {
    return { select: mockSelect, update: mockUpdate };
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

  it('debería retornar 404 si el bounty no existe', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
    
    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Bounty no encontrado');
  });

  it('debería retornar 400 si el bounty ya no está pendiente', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({ data: { id: 'b1', estado: 'reclamado' }, error: null });
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('El bounty ya fue reclamado');
  });

  it('debería retornar 500 si falla la actualización del bounty', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 50 }, error: null });
    mockEqUpdate.mockResolvedValue({ error: new Error('Update failed') });
    
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Error al actualizar el bounty');
  });

  it('debería procesar el claim correctamente e insertar bricks', async () => {
    const req = createRequest({ bountyId: 'b1', setId: 's1' });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSingle.mockResolvedValue({ data: { id: 'b1', estado: 'pendiente', recompensa: 5 }, error: null });
    mockEqUpdate.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reward).toBe(5);
    
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'reclamado', reclamado_por: 'u1' });
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 'b1');
    expect(mockInsert).toHaveBeenCalled();
    const insertArgs = mockInsert.mock.calls[0][0];
    expect(insertArgs.length).toBe(5); // 5 bricks
    expect(insertArgs[0].set_id).toBe('s1');
    expect(insertArgs[0].hash_visitante).toContain('bounty-b1-0-');
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
