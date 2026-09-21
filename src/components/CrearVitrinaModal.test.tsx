import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CrearVitrinaModal } from './CrearVitrinaModal';
import { createClient } from '@/lib/supabase/client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('CrearVitrinaModal — invitado (ADR-011)', () => {
  let insert: ReturnType<typeof vi.fn>;
  const montar = (user: { id: string; is_anonymous: boolean } | null) => {
    insert = vi.fn().mockReturnValue({ select: () => ({ single: () => Promise.resolve({ data: { id: 'v1' }, error: null }) }) });
    vi.mocked(createClient).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as ReturnType<typeof createClient>);
    render(<CrearVitrinaModal isOpen onClose={vi.fn()} />);
  };

  beforeEach(() => vi.clearAllMocks());

  it('invitado: la vitrina se crea en "privada" y "Pública" está deshabilitada', async () => {
    montar({ id: 'g1', is_anonymous: true });
    const publica = screen.getByText('Pública', { selector: 'span' }).closest('button')!;
    await waitFor(() => expect(publica).toBeDisabled());

    fireEvent.change(screen.getByLabelText(/Nombre de la Vitrina/i), { target: { value: 'Mi demo' } });
    fireEvent.submit(screen.getByRole('button', { name: /Crear Vitrina/i }).closest('form')!);

    await waitFor(() => expect(insert).toHaveBeenCalledWith(expect.objectContaining({ visibilidad: 'privada' })));
    expect(screen.getByText(/En modo demo tus vitrinas son privadas/i)).toBeInTheDocument();
  });

  it('cuenta real: mantiene "pública" por defecto y habilitada', async () => {
    montar({ id: 'u1', is_anonymous: false });
    const publica = screen.getByText('Pública', { selector: 'span' }).closest('button')!;
    expect(publica).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Nombre de la Vitrina/i), { target: { value: 'Mi colección' } });
    fireEvent.submit(screen.getByRole('button', { name: /Crear Vitrina/i }).closest('form')!);

    await waitFor(() => expect(insert).toHaveBeenCalledWith(expect.objectContaining({ visibilidad: 'pública' })));
  });
});
