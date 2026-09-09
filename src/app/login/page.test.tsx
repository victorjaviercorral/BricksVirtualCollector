import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import Login from './page';
import { createClient } from '@/lib/supabase/client';

// El auto-registro implícito y el checkbox de términos en el login se retiraron en la Fase 2 del
// acceso de invitado (ADR-011): decisión de producto, no un test mal escrito. El registro real
// vive ahora en /registro. Ver docs/testing/fase2-login-registro.md.
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('Página de Login (solo entrar)', () => {
  let mockSignInWithPassword: Mock;
  let mockSignInAnonymously: Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSignInWithPassword = vi.fn();
    mockSignInAnonymously = vi.fn();

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signInAnonymously: mockSignInAnonymously,
      },
    } as unknown as ReturnType<typeof createClient>);

    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
  });

  it('renderiza el formulario de entrada sin checkbox de términos', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: 'Acceso Seguro' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('coleccionista@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('ofrece crear cuenta y probar como invitado', () => {
    render(<Login />);
    expect(screen.getByRole('link', { name: /crea una cuenta/i })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('button', { name: /probar sin registrarme/i })).toBeInTheDocument();
  });

  it('login correcto redirige al dashboard', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('credenciales inválidas: muestra mensaje y enlace a /registro, sin crear cuenta', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'desconocido@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /no tienes cuenta todavía/i })).toHaveAttribute('href', '/registro');
    });
    expect(window.location.href).toBe('');
  });

  it('otros errores de login se muestran tal cual', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Rate limit exceeded' } });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });
});
