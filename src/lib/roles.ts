/**
 * Roles con permiso de moderación (aprobar/rechazar participaciones en exposiciones).
 *
 * Única fuente de verdad para esta comprobación de autorización, consumida por:
 *  - src/app/admin/layout.tsx (visibilidad del enlace "Moderación" en el sidebar)
 *  - src/app/admin/moderacion/page.tsx (gate de la página)
 *  - src/app/admin/moderacion/actions.ts (gate de las Server Actions)
 *
 * Antes de esta consolidación (hallazgo N7, Iteración 3) la lista vivía duplicada en tres
 * sitios y dos de ellos habían divergido: layout.tsx enseñaba el enlace también a "sysadmin"
 * (con una comprobación por subcadena, `role.includes('admin')`, que además coincide de forma
 * no intencionada con cualquier rol futuro que contenga "admin" en el nombre), mientras que
 * page.tsx y actions.ts lo rechazaban con comparación exacta. Resultado: un sysadmin veía el
 * enlace a Moderación y era expulsado nada más pulsarlo.
 *
 * Decisión del titular (18/08/2026, D2 del plan de intervención en
 * docs/05-plan/plan-intervencion-post-iteracion-3.md): sysadmin no modera. El proyecto lo
 * gestiona una única persona y no se va a crear un rol sysadmin separado para este propósito
 * -- admin y admin_exposiciones son los únicos roles con permiso de moderación.
 */
export const MODERATOR_ROLES = ["admin", "admin_exposiciones"] as const;

export function isModeratorRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (MODERATOR_ROLES as readonly string[]).includes(role);
}
