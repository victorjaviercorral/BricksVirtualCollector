import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('POST /api/auth/delete-account', () => {
  const OLD_ENV = process.env;
  const mockGetUser = vi.fn();
  const mockDeleteUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    };
    (createServerClient as any).mockResolvedValue({
      auth: { getUser: mockGetUser },
    });
    (createAdminClient as any).mockReturnValue({
      auth: { admin: { deleteUser: mockDeleteUser } },
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('devuelve 401 si no hay sesión', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('devuelve 401 si getUser devuelve error de auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });

    const res = await POST();

    expect(res.status).toBe(401);
  });

  it('devuelve 500 sin intentar borrar si falta SUPABASE_SERVICE_ROLE_KEY', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });

    const res = await POST();

    expect(res.status).toBe(500);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('borra al usuario autenticado con el cliente admin y devuelve éxito', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });
    mockDeleteUser.mockResolvedValue({ error: null });

    const res = await POST();

    expect(createAdminClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'service-role-key',
      expect.objectContaining({ auth: expect.objectContaining({ persistSession: false }) })
    );
    expect(mockDeleteUser).toHaveBeenCalledWith('user1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it('devuelve 500 si el cliente admin falla al borrar', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user1' } }, error: null });
    mockDeleteUser.mockResolvedValue({ error: { message: 'delete failed' } });

    const res = await POST();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('No se pudo eliminar la cuenta.');
  });

  it('devuelve 500 ante una excepción inesperada', async () => {
    mockGetUser.mockRejectedValue(new Error('network down'));

    const res = await POST();

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Error interno del servidor');
  });
});
