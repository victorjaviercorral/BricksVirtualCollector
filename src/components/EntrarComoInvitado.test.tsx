import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { EntrarComoInvitado } from './EntrarComoInvitado';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { GUEST_TERMS_VERSION } from '@/lib/legal';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('EntrarComoInvitado', () => {
  let mockSignInAnonymously: Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSignInAnonymously = vi.fn();
    vi.mocked(createClient).mockReturnValue({
      auth: { signInAnonymously: mockSignInAnonymously },
    } as unknown as ReturnType<typeof createClient>);
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
  });

  it('variante panel: muestra la nota de aceptación tácita y el enlace a Términos', () => {
    render(<EntrarComoInvitado variant="panel" />);
    expect(screen.getByText(/Zona de pruebas para early adopters/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Términos y Condiciones/i })).toHaveAttribute(
      'href',
      '/legal/terminos-condiciones'
    );
    expect(screen.getByRole('button', { name: /Probar sin registrarme/i })).toBeInTheDocument();
  });

  it('crea la sesión anónima con guest_terms_version y redirige al dashboard', async () => {
    mockSignInAnonymously.mockResolvedValueOnce({ error: null });
    render(<EntrarComoInvitado variant="panel" />);

    fireEvent.click(screen.getByRole('button', { name: /Probar sin registrarme/i }));

    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalledWith({
        options: { data: { guest_terms_version: GUEST_TERMS_VERSION } },
      });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('muestra un toast de error y no redirige si signInAnonymously falla', async () => {
    mockSignInAnonymously.mockResolvedValueOnce({ error: { message: 'Anonymous sign-ins are disabled' } });
    render(<EntrarComoInvitado variant="panel" />);

    fireEvent.click(screen.getByRole('button', { name: /Probar sin registrarme/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/no se pudo iniciar la demo/i));
    });
    expect(window.location.href).toBe('');
  });

  it('variante hero: renderiza el enlace discreto y también entra como invitado', async () => {
    mockSignInAnonymously.mockResolvedValueOnce({ error: null });
    render(<EntrarComoInvitado variant="hero" />);

    const btn = screen.getByRole('button', { name: /prueba la demo sin registrarte/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('deshabilita el botón mientras se está creando la sesión', async () => {
    let resolve: (v: unknown) => void = () => {};
    mockSignInAnonymously.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<EntrarComoInvitado variant="panel" />);

    const btn = screen.getByRole('button', { name: /Probar sin registrarme/i });
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByRole('button', { name: /Entrando a la demo/i })).toBeDisabled());
    resolve({ error: null });
  });
});
