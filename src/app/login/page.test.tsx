import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './page';
import { createClient } from '@/lib/supabase/client';

// Mocks
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('Página de Login', () => {
  let mockSignInWithPassword: any;
  let mockSignUp: any;

  beforeEach(() => {
    vi.resetAllMocks();
    
    mockSignInWithPassword = vi.fn();
    mockSignUp = vi.fn();

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
      }
    } as any);

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });
  });

  it('debe renderizar el formulario correctamente', () => {
    render(<Login />);
    
    expect(screen.getByText('Acceso Seguro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('coleccionista@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('debe mostrar error si no se aceptan los términos', () => {
    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByText('Debes aceptar la Política de Privacidad y los Términos para continuar.')).toBeInTheDocument();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('debe manejar el login exitoso y redirigir a dashboard', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /He leído y acepto/i }));
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('debe registrar al usuario si el login falla por credenciales inválidas y redirigir', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    mockSignUp.mockResolvedValueOnce({ data: { session: { user: 'test' } }, error: null });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /He leído y acepto/i }));
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({ email: 'new@test.com', password: 'password123', options: { data: { terms_version: 'v1.0' } } });
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('debe mostrar mensaje si el registro se completó pero requiere confirmación', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    mockSignUp.mockResolvedValueOnce({ data: { session: null }, error: null });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /He leído y acepto/i }));
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/exige confirmación por email/i)).toBeInTheDocument();
      expect(window.location.href).not.toBe('/dashboard');
    });
  });

  it('debe mostrar mensaje de error si el registro falla', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } });
    mockSignUp.mockResolvedValueOnce({ data: { session: null }, error: { message: 'Password is too weak' } });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /He leído y acepto/i }));
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Password is too weak')).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje de error del login original si el error no es por credenciales inválidas', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Rate limit exceeded' } });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('coleccionista@ejemplo.com'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /He leído y acepto/i }));
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });
});
