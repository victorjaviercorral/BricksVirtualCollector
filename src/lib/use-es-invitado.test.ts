import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEsInvitado } from './use-es-invitado';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

const conUsuario = (user: unknown) =>
  vi.mocked(createClient).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  } as unknown as ReturnType<typeof createClient>);

describe('useEsInvitado', () => {
  it('true para una sesión anónima', async () => {
    conUsuario({ id: 'g1', is_anonymous: true });
    const { result } = renderHook(() => useEsInvitado());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('false para una cuenta real', async () => {
    conUsuario({ id: 'u1', is_anonymous: false });
    const { result } = renderHook(() => useEsInvitado());
    await waitFor(() => expect(createClient().auth.getUser).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('false sin sesión', async () => {
    conUsuario(null);
    const { result } = renderHook(() => useEsInvitado());
    await waitFor(() => expect(createClient().auth.getUser).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
});
