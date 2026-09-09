import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BannerInvitado } from './BannerInvitado';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn(() => ({ auth: { updateUser: vi.fn() } })) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('BannerInvitado', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el aviso de modo demo con la caducidad de 48 h', () => {
    render(<BannerInvitado />);
    expect(screen.getByText(/modo demo/i)).toBeInTheDocument();
    expect(screen.getByText(/48/)).toBeInTheDocument();
  });

  it('el botón abre el modal de upgrade', () => {
    render(<BannerInvitado />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /crea(ndo)? una cuenta/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /guarda tu colección/i })).toBeInTheDocument();
  });
});
