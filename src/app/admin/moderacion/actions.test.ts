import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveAction, rejectAction } from './actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

/**
 * Construye un cliente mock cuyo comportamiento depende de la tabla consultada:
 * - usuarios_perfil: resuelve con el rol indicado (o sin perfil si role es null).
 * - exposicion_sets: expone update().eq() para verificar la mutación real.
 */
function mockSupabaseWithRole(role: string | null, userId: string | null = 'mod-1') {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

  const from = vi.fn((table: string) => {
    if (table === 'usuarios_perfil') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: role ? { role } : null }),
          }),
        }),
      };
    }
    if (table === 'exposicion_sets') {
      return { update: mockUpdate };
    }
    return {};
  });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from,
  };

  vi.mocked(createClient).mockResolvedValue(supabase as any);
  return { supabase, mockUpdate, mockEq, from };
}

describe('Moderacion Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('con rol autorizado (admin)', () => {
    it('approveAction actualiza a aprobado y revalida', async () => {
      const { mockUpdate, mockEq, from } = mockSupabaseWithRole('admin');
      const formData = new FormData();
      formData.append('id', 'item-123');

      await approveAction(formData);

      expect(from).toHaveBeenCalledWith('exposicion_sets');
      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'aprobado' });
      expect(mockEq).toHaveBeenCalledWith('id', 'item-123');
      expect(revalidatePath).toHaveBeenCalledWith('/admin/moderacion');
    });

    it('rejectAction actualiza a rechazado y revalida', async () => {
      const { mockUpdate, mockEq } = mockSupabaseWithRole('admin_exposiciones');
      const formData = new FormData();
      formData.append('id', 'item-456');

      await rejectAction(formData);

      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'rechazado' });
      expect(mockEq).toHaveBeenCalledWith('id', 'item-456');
      expect(revalidatePath).toHaveBeenCalledWith('/admin/moderacion');
    });
  });

  describe('sin id', () => {
    it('approveAction no hace nada si falta id (ni siquiera comprueba el rol)', async () => {
      const { from } = mockSupabaseWithRole('admin');
      const formData = new FormData();

      await approveAction(formData);

      expect(from).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('rejectAction no hace nada si falta id', async () => {
      const { from } = mockSupabaseWithRole('admin');
      const formData = new FormData();

      await rejectAction(formData);

      expect(from).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('sin autorización (hallazgo S2 -- regresión)', () => {
    it('approveAction no muta nada si no hay sesión', async () => {
      const { mockUpdate } = mockSupabaseWithRole('admin', null);
      const formData = new FormData();
      formData.append('id', 'item-789');

      await approveAction(formData);

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('approveAction no muta nada si el usuario no tiene perfil', async () => {
      const { mockUpdate } = mockSupabaseWithRole(null);
      const formData = new FormData();
      formData.append('id', 'item-789');

      await approveAction(formData);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('approveAction no muta nada si el rol es "user"', async () => {
      const { mockUpdate } = mockSupabaseWithRole('user');
      const formData = new FormData();
      formData.append('id', 'item-789');

      await approveAction(formData);

      expect(mockUpdate).not.toHaveBeenCalled();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('rejectAction no muta nada si el rol es "sysadmin" (no está en la lista de moderadores de esta acción)', async () => {
      const { mockUpdate } = mockSupabaseWithRole('sysadmin');
      const formData = new FormData();
      formData.append('id', 'item-999');

      await rejectAction(formData);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
