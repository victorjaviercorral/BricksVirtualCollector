import { describe, it, expect, vi } from 'vitest';
import sitemap from './sitemap';
import { getVitrinasPublicas } from '@/lib/queries/vitrinas';
import { SITE_URL } from '@/lib/site';

vi.mock('@/lib/queries/vitrinas', () => ({
  getVitrinasPublicas: vi.fn(),
}));

describe('sitemap.ts (hallazgo E8 del preflight — /sitemap.xml daba 404)', () => {
  it('incluye las rutas estáticas de "Explorar" y ninguna del área con sesión', async () => {
    vi.mocked(getVitrinasPublicas).mockResolvedValue([]);

    const result = await sitemap();
    const urls = result.map((r) => r.url);

    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/galeria`);
    expect(urls).toContain(`${SITE_URL}/bounties`);
    expect(urls.some((u) => u.includes('/dashboard'))).toBe(false);
    expect(urls.some((u) => u.includes('/admin'))).toBe(false);
  });

  it('añade una entrada por cada vitrina pública real, reutilizando getVitrinasPublicas (Zero-Duplication)', async () => {
    vi.mocked(getVitrinasPublicas).mockResolvedValue([
      { id: 'v1', creado_en: '2026-01-01T00:00:00.000Z' },
      { id: 'v2', creado_en: null },
    ] as never);

    const result = await sitemap();
    const dinamicas = result.filter((r) => r.url.includes('/vitrina/'));

    expect(dinamicas).toHaveLength(2);
    expect(dinamicas[0].url).toBe(`${SITE_URL}/vitrina/v1`);
    expect(dinamicas[0].lastModified).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(dinamicas[1].lastModified).toBeUndefined();
  });
});
