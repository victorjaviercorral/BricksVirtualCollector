import { describe, it, expect } from 'vitest';
import robots from './robots';
import { SITE_URL } from '@/lib/site';

describe('robots.ts (hallazgo E8 del preflight — /robots.txt daba 404)', () => {
  it('permite indexar y excluye las áreas que exigen sesión y el panel de administración', () => {
    const result = robots();

    expect(result.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/mesa-de-trabajo', '/admin', '/ajustes', '/api'],
    });
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
