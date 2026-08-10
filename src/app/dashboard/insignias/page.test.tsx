import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MisInsigniasPage from './page';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation(() => { throw new Error('redirect') }),
}));

vi.mock('@/components/badges/InsigniasClient', () => ({
  default: ({ userProfile, user }: any) => (
    <div data-testid="insignias-client">
      <span data-testid="user-id">{user.id}</span>
      <span data-testid="profile-keys">{Object.keys(userProfile).length}</span>
    </div>
  ),
}));

describe('MisInsigniasPage (SSR)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirecciona a login si no hay usuario', async () => {
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    try {
      await MisInsigniasPage();
    } catch (e: any) {
      expect(e.message).toBe('redirect');
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renderiza InsigniasClient con el perfil del usuario autenticado', async () => {
    const single = vi.fn().mockResolvedValue({ data: { alias: 'Builder', role: 'user' } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from,
    });

    const jsx = await MisInsigniasPage();
    render(jsx);

    expect(from).toHaveBeenCalledWith('usuarios_perfil');
    expect(screen.getByTestId('insignias-client')).toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toHaveTextContent('user1');
    expect(screen.getByTestId('profile-keys')).toHaveTextContent('2');
  });

  it('pasa un perfil vacío ({}) si la consulta no devuelve datos', async () => {
    const single = vi.fn().mockResolvedValue({ data: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    (createClient as any).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } } }) },
      from,
    });

    const jsx = await MisInsigniasPage();
    render(jsx);

    expect(screen.getByTestId('profile-keys')).toHaveTextContent('0');
  });
});
