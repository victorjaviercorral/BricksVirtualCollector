import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from './server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Supabase Client (Server)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('debe inicializar createServerClient correctamente y proveer métodos de cookies', async () => {
    const mockGetAll = vi.fn().mockReturnValue([{ name: 'test', value: '123' }]);
    const mockSet = vi.fn();
    
    (cookies as any).mockResolvedValue({
      getAll: mockGetAll,
      set: mockSet
    });

    await createClient();

    expect(createServerClient).toHaveBeenCalled();
    const configCall = vi.mocked(createServerClient).mock.calls[0][2] as any;
    expect(configCall?.cookies).toBeDefined();

    // Probamos getAll
    const getAllResult = configCall?.cookies?.getAll?.();
    expect(getAllResult).toEqual([{ name: 'test', value: '123' }]);
    expect(mockGetAll).toHaveBeenCalled();

    // Probamos setAll (éxito)
    configCall?.cookies?.setAll?.([{ name: 'test', value: '123', options: {} }]);
    expect(mockSet).toHaveBeenCalledWith('test', '123', {});
  });

  it('debe manejar el error en setAll si es llamado desde un Server Component', async () => {
    const mockSet = vi.fn().mockImplementation(() => {
      throw new Error('No puedes setear cookies desde Server Component');
    });
    
    (cookies as any).mockResolvedValue({
      getAll: vi.fn(),
      set: mockSet
    });

    await createClient();
    const configCall = vi.mocked(createServerClient).mock.calls[0][2] as any;
    
    // No debe lanzar excepción hacia arriba (catch silencioso intencional por SSR de Next)
    expect(() => {
      configCall?.cookies?.setAll?.([{ name: 'test', value: '123', options: {} }]);
    }).not.toThrow();
  });
});
