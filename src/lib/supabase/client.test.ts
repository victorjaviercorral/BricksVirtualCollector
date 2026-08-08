import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from './client';
import { createBrowserClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}));

describe('Supabase Client (Browser)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('debe inicializar createBrowserClient con las variables de entorno correctas', () => {
    createClient();
    
    expect(createBrowserClient).toHaveBeenCalledWith(
      'http://localhost:54321',
      'anon-key'
    );
  });
});
