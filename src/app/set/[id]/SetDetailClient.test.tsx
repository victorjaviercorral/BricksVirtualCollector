import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SetDetailClient from './SetDetailClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('framer-motion/client', () => ({
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('SetDetailClient', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  const set = {
    id: 'set-1',
    nombre: 'Halcón Milenario',
    tematica: 'Star Wars',
    num_piezas: 7541,
    estado: 'Nuevo en Caja (MISB)',
    bricks_recibidos: 320,
    creado_en: '2024-06-01T00:00:00.000Z',
    fotos: [{ url: '/halcon.jpg' }],
    usuarios_perfil: { id: 'owner-1', alias: 'Han Solo', username: 'han' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush, refresh: mockRefresh });
    global.fetch = vi.fn();
  });

  it('renderiza nombre, temática, piezas, año de alta y dueño', () => {
    render(<SetDetailClient set={set} isLoggedIn={false} yaVotado={false} />);

    expect(screen.getByText('Halcón Milenario')).toBeInTheDocument();
    expect(screen.getByText('Star Wars')).toBeInTheDocument();
    expect(screen.getByText(/7,541 piezas|7541 piezas/)).toBeInTheDocument();
    expect(screen.getByText(/Alta en 2024/)).toBeInTheDocument();
    expect(screen.getByText('Han Solo')).toBeInTheDocument();
    expect(screen.getByText('Nuevo en Caja (MISB)')).toBeInTheDocument();
  });

  it('usa el username como respaldo cuando el dueño no tiene alias', () => {
    render(<SetDetailClient set={{ ...set, usuarios_perfil: { id: 'owner-1', alias: null, username: 'han' } }} isLoggedIn={false} yaVotado={false} />);

    expect(screen.getByText('han')).toBeInTheDocument();
  });

  it('redirige a /login al pulsar el botón de Brick si no hay sesión', () => {
    render(<SetDetailClient set={set} isLoggedIn={false} yaVotado={false} />);

    fireEvent.click(screen.getByText(/320 Bricks/));

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('envía el brick, incrementa el contador local y notifica éxito', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    render(<SetDetailClient set={set} isLoggedIn={true} yaVotado={false} />);

    fireEvent.click(screen.getByText(/320 Bricks/));

    await waitFor(() => expect(screen.getByText(/321 Bricks/)).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/bricks', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ set_id: 'set-1' }),
    }));
    expect(toast.success).toHaveBeenCalledWith('¡Brick enviado!');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('el botón está deshabilitado y no envía nada si ya se votó', () => {
    render(<SetDetailClient set={set} isLoggedIn={true} yaVotado={true} />);

    const button = screen.getByText(/320 Bricks/).closest('button')!;
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('muestra un toast de error si la API responde con error', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, json: async () => ({ error: 'Ya has dado un Brick a este set' }) });

    render(<SetDetailClient set={set} isLoggedIn={true} yaVotado={false} />);

    fireEvent.click(screen.getByText(/320 Bricks/));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Ya has dado un Brick a este set'));
    expect(screen.getByText(/320 Bricks/)).toBeInTheDocument(); // no incrementa
  });

  it('muestra un toast de error si la petición falla por conexión', async () => {
    (global.fetch as any).mockRejectedValue(new Error('network down'));

    render(<SetDetailClient set={set} isLoggedIn={true} yaVotado={false} />);

    fireEvent.click(screen.getByText(/320 Bricks/));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error de conexión al enviar el Brick'));
  });

  it('muestra un placeholder cuando el set no tiene foto', () => {
    render(<SetDetailClient set={{ ...set, fotos: [] }} isLoggedIn={false} yaVotado={false} />);

    expect(screen.queryByAltText('Halcón Milenario')).not.toBeInTheDocument();
  });
});
