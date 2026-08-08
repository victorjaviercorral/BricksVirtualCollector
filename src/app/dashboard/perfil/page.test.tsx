import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerfilPage from './page';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  }
}));

describe('PerfilPage (Client)', () => {
  let mockSupabase: any;
  const mockProfile = {
    id: 'u1',
    username: 'MasterBuilder',
    alias: 'Maestro',
    creado_en: '2023-01-01',
    avatar_url: 'avatar.png'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
        signOut: vi.fn().mockResolvedValue({ error: null })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'new_avatar.png' } })
        })
      }
    };
    (createClient as any).mockReturnValue(mockSupabase);
    window.confirm = vi.fn().mockReturnValue(true);
    
    // Mock location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });
    
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it('muestra loader y luego carga el perfil', async () => {
    const { container } = render(<PerfilPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('MasterBuilder')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Maestro')).toBeInTheDocument();
    });
  });

  it('permite actualizar el alias', async () => {
    render(<PerfilPage />);
    await waitFor(() => expect(screen.getByDisplayValue('Maestro')).toBeInTheDocument());

    const input = screen.getByDisplayValue('Maestro');
    fireEvent.change(input, { target: { value: 'Nuevo Maestro' } });

    fireEvent.submit(screen.getByText('Guardar Cambios').closest('form')!);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios_perfil');
      expect(toast.success).toHaveBeenCalledWith('Perfil actualizado correctamente');
    });
  });

  it('permite eliminar foto actual', async () => {
    render(<PerfilPage />);
    await waitFor(() => expect(screen.getByText('Eliminar foto actual')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Eliminar foto actual'));

    await waitFor(() => {
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ avatar_url: null });
      expect(toast.success).toHaveBeenCalledWith('Foto de perfil eliminada');
      expect(screen.queryByText('Eliminar foto actual')).not.toBeInTheDocument();
    });
  });

  it('permite subir un nuevo avatar', async () => {
    render(<PerfilPage />);
    await waitFor(() => expect(screen.getByText('MasterBuilder')).toBeInTheDocument());

    const file = new File([''], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('avatars');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ avatar_url: 'new_avatar.png' });
      expect(toast.success).toHaveBeenCalledWith('Foto de perfil actualizada');
    });
  });

  it('muestra error si el archivo no es imagen o es muy grande', async () => {
    render(<PerfilPage />);
    await waitFor(() => expect(screen.getByText('MasterBuilder')).toBeInTheDocument());

    const input = screen.getByLabelText('', { selector: 'input[type="file"]' });
    
    // No imagen
    const file1 = new File([''], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file1] } });
    expect(toast.error).toHaveBeenCalledWith('Por favor, selecciona una imagen válida');

    // Muy grande
    const file2 = new File([new ArrayBuffer(3 * 1024 * 1024)], 'test.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file2] } });
    expect(toast.error).toHaveBeenCalledWith('La imagen no puede pesar más de 2MB');
  });

  it('permite eliminar cuenta permanentemente', async () => {
    render(<PerfilPage />);
    await waitFor(() => expect(screen.getByText('MasterBuilder')).toBeInTheDocument());

    const btn = screen.getByText('Eliminar Cuenta Permanentemente');
    fireEvent.click(btn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/delete-account', expect.any(Object));
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });
  });
});
