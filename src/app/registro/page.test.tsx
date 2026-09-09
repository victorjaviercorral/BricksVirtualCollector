import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import Registro from './page';
import { createClient } from '@/lib/supabase/client';
import { TERMS_VERSION } from '@/lib/legal';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('Página de Registro', () => {
  let mockSignUp: Mock;
  let mockSignInAnonymously: Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    mockSignUp = vi.fn();
    mockSignInAnonymously = vi.fn();

    vi.mocked(createClient).mockReturnValue({
      auth: { signUp: mockSignUp, signInAnonymously: mockSignInAnonymously },
    } as unknown as ReturnType<typeof createClient>);

    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
  });

  const rellenar = () => {
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'nuevo@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
  };

  it('renderiza el formulario con checkbox obligatorio de términos', () => {
    render(<Registro />);
    expect(screen.getByRole('heading', { name: /crea tu cuenta/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /entra/i })).toHaveAttribute('href', '/login');
  });

  it('sin aceptar términos: muestra error y no llama a signUp', () => {
    render(<Registro />);
    rellenar();
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(screen.getByText(/debes aceptar la política de privacidad/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('con términos aceptados: registra con terms_version y redirige si hay sesión', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { session: { user: 'x' } }, error: null });
    render(<Registro />);
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'nuevo@test.com',
        password: 'password123',
        options: { data: { terms_version: TERMS_VERSION } },
      });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('sin sesión inmediata: muestra el aviso de confirmación por email', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { session: null }, error: null });
    render(<Registro />);
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText(/revisa tu correo para confirmar/i)).toBeInTheDocument();
      expect(window.location.href).toBe('');
    });
  });

  it('error de signUp: se muestra el mensaje', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { session: null }, error: { message: 'Password should be at least 6 characters' } });
    render(<Registro />);
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByText('Password should be at least 6 characters')).toBeInTheDocument();
    });
  });
});
