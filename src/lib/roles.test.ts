import { describe, it, expect } from 'vitest';
import { MODERATOR_ROLES, isModeratorRole } from './roles';

describe('isModeratorRole', () => {
  it('acepta "admin"', () => {
    expect(isModeratorRole('admin')).toBe(true);
  });

  it('acepta "admin_exposiciones"', () => {
    expect(isModeratorRole('admin_exposiciones')).toBe(true);
  });

  it('rechaza "sysadmin" (hallazgo N7/decisión D2: sysadmin no modera)', () => {
    expect(isModeratorRole('sysadmin')).toBe(false);
  });

  it('rechaza un rol vacío, null o undefined', () => {
    expect(isModeratorRole('')).toBe(false);
    expect(isModeratorRole(null)).toBe(false);
    expect(isModeratorRole(undefined)).toBe(false);
  });

  it('usa comparación exacta, no por subcadena', () => {
    // Un rol futuro que solo contenga "admin" como subcadena no debe colarse -- el bug original
    // de admin/layout.tsx era exactamente usar role.includes('admin') en vez de una lista exacta.
    expect(isModeratorRole('administrator_backup')).toBe(false);
  });

  it('MODERATOR_ROLES contiene exactamente los dos roles esperados', () => {
    expect(MODERATOR_ROLES).toEqual(['admin', 'admin_exposiciones']);
  });
});
