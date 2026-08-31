import { describe, it, expect } from 'vitest';
import { MODERATOR_ROLES, SYSTEM_ROLES, isModeratorRole, isSystemRole } from './roles';

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

describe('isSystemRole', () => {
  it('acepta "admin" y "sysadmin"', () => {
    expect(isSystemRole('admin')).toBe(true);
    expect(isSystemRole('sysadmin')).toBe(true);
  });

  it('rechaza "admin_exposiciones" (no gestiona el panel de sistema)', () => {
    expect(isSystemRole('admin_exposiciones')).toBe(false);
  });

  it('rechaza un rol vacío, null o undefined', () => {
    expect(isSystemRole('')).toBe(false);
    expect(isSystemRole(null)).toBe(false);
    expect(isSystemRole(undefined)).toBe(false);
  });

  it('rechaza el valor mal formado real que causó este hallazgo ("admin, sysadmin")', () => {
    // Es una sola cadena, no dos roles -- por eso una comparación exacta la rechaza aunque
    // contenga ambas palabras. Documenta el caso real que motivó esta función y la migración
    // 20260819100000_validar_role_usuarios_perfil.sql.
    expect(isSystemRole('admin, sysadmin')).toBe(false);
  });

  it('SYSTEM_ROLES contiene exactamente los dos roles esperados', () => {
    expect(SYSTEM_ROLES).toEqual(['admin', 'sysadmin']);
  });
});
