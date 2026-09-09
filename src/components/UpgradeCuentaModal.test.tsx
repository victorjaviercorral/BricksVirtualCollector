import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { UpgradeCuentaModal } from './UpgradeCuentaModal';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { TERMS_VERSION } from '@/lib/legal';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('UpgradeCuentaModal', () => {
  let mockUpdateUser: Mock;
  const onClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockUpdateUser = vi.fn();
    vi.mocked(createClient).mockReturnValue({
      auth: { updateUser: mockUpdateUser },
    } as unknown as ReturnType<typeof createClient>);
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
  });

  const abrir = () => render(<UpgradeCuentaModal isOpen onClose={onClose} />);
  const rellenar = () => {
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'real@test.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
  };

  it('no renderiza nada si isOpen es false', () => {
    const { container } = render(<UpgradeCuentaModal isOpen={false} onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el formulario con checkbox de términos', () => {
    abrir();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('sin aceptar términos: toast de error y no llama a updateUser', () => {
    abrir();
    rellenar();
    fireEvent.click(screen.getByRole('button', { name: /guardar mi colección/i }));
    expect(toast.error).toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('upgrade con confirmación inmediata (is_anonymous=false): éxito y redirección', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: { user: { is_anonymous: false, email: 'real@test.com' } }, error: null });
    abrir();
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /guardar mi colección/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        email: 'real@test.com',
        password: 'password123',
        data: { terms_version: TERMS_VERSION },
      });
      expect(toast.success).toHaveBeenCalled();
      expect(window.location.href).toBe('/dashboard');
    });
  });

  it('upgrade con email pendiente (is_anonymous sigue true): muestra "revisa tu correo"', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: { user: { is_anonymous: true } }, error: null });
    abrir();
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /guardar mi colección/i }));

    await waitFor(() => {
      expect(screen.getByText(/te hemos enviado un enlace a/i)).toBeInTheDocument();
      expect(screen.getByText('real@test.com')).toBeInTheDocument();
    });
    expect(window.location.href).toBe('');
  });

  it('error de updateUser: toast con el mensaje', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Email already registered' } });
    abrir();
    rellenar();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /guardar mi colección/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email already registered'));
  });

  it('Escape cierra el modal', () => {
    abrir();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
