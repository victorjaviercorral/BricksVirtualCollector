import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn((table: string) => {
  if (table === 'bricks_recibidos') {
    return { insert: mockInsert };
  }
  return {};
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/bricks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const SET_ID = '11111111-1111-4111-8111-111111111111';

describe('POST /api/bricks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 401 si no hay usuario autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(createRequest({ set_id: SET_ID }));

    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('devuelve 400 si falta set_id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });

    const res = await POST(createRequest({}));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('set_id debe ser un identificador válido');
  });

  // Hallazgo S1: antes cualquier string no vacío pasaba (p.ej. "set1", usado en los tests
  // originales) -- ahora Zod exige un UUID real, coherente con el tipo de columna en Postgres.
  it('devuelve 400 si set_id no es un UUID válido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });

    const res = await POST(createRequest({ set_id: 'no-es-un-uuid' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('set_id debe ser un identificador válido');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('inserta el brick usando el id del usuario como hash_visitante y devuelve éxito', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });
    mockInsert.mockResolvedValue({ error: null });

    const res = await POST(createRequest({ set_id: SET_ID }));

    expect(mockFrom).toHaveBeenCalledWith('bricks_recibidos');
    expect(mockInsert).toHaveBeenCalledWith({ set_id: SET_ID, hash_visitante: 'user1' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it('devuelve 400 "ya has dado un Brick" ante una violación de unicidad (23505)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });
    mockInsert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });

    const res = await POST(createRequest({ set_id: SET_ID }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Ya has dado un Brick a este set');
  });

  it('devuelve 500 ante cualquier otro error de Supabase', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });
    mockInsert.mockResolvedValue({ error: { code: 'XXOOO', message: 'db error' } });

    const res = await POST(createRequest({ set_id: SET_ID }));

    expect(res.status).toBe(500);
  });

  it('devuelve 500 si el cuerpo de la petición no es JSON válido', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } } });

    const badRequest = new Request('http://localhost:3000/api/bricks', {
      method: 'POST',
      body: '{not-json',
    });

    const res = await POST(badRequest);

    expect(res.status).toBe(500);
  });
});
