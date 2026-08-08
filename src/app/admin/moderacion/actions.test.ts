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

describe('Moderacion Server Actions', () => {
  const mockFrom = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(createClient).mockResolvedValue({
      from: mockFrom
    } as any);

    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('approveAction actualiza a aprobado y revalida', async () => {
    const formData = new FormData();
    formData.append('id', 'item-123');
    
    await approveAction(formData);

    expect(mockFrom).toHaveBeenCalledWith('exposicion_sets');
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'aprobado' });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-123');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/moderacion');
  });

  it('approveAction no hace nada si falta id', async () => {
    const formData = new FormData();
    
    await approveAction(formData);

    expect(mockFrom).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejectAction actualiza a rechazado y revalida', async () => {
    const formData = new FormData();
    formData.append('id', 'item-456');
    
    await rejectAction(formData);

    expect(mockFrom).toHaveBeenCalledWith('exposicion_sets');
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'rechazado' });
    expect(mockEq).toHaveBeenCalledWith('id', 'item-456');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/moderacion');
  });

  it('rejectAction no hace nada si falta id', async () => {
    const formData = new FormData();
    
    await rejectAction(formData);

    expect(mockFrom).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
