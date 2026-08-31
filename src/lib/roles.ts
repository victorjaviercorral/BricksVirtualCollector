/**
 * Fuente única de verdad para las comprobaciones de rol de `usuarios_perfil.role`.
 *
 * Antes de la consolidación (hallazgo N7, Iteración 3) la lista de moderadores vivía duplicada
 * en tres sitios y dos habían divergido: layout.tsx enseñaba el enlace de Moderación también a
 * "sysadmin" (con una comprobación por subcadena, `role.includes('admin')`, que además coincide
 * de forma no intencionada con cualquier rol futuro que contenga "admin" en el nombre), mientras
 * que page.tsx y actions.ts lo rechazaban con comparación exacta. Resultado: un sysadmin veía el
 * enlace a Moderación y era expulsado nada más pulsarlo.
 *
 * Decisión del titular (18/08/2026, D2 del plan de intervención en
 * docs/05-plan/plan-intervencion-post-iteracion-3.md): sysadmin no modera. El proyecto lo
 * gestiona una única persona y no se va a crear un rol sysadmin separado para este propósito
 * -- admin y admin_exposiciones son los únicos roles con permiso de moderación.
 *
 * Ampliada el 19/08/2026 (mismo hilo de trabajo): al probar el reparto real de insignias se
 * detectó `usuarios_perfil.role = "admin, sysadmin"` -- una sola cadena mal formada, no dos
 * roles, guardada así porque nada validaba el valor. El chequeo por subcadena de `/admin/system/*`
 * (antes solo `role.includes('sysadmin')`) la dejaba pasar por casualidad, pero las políticas RLS
 * y los chequeos de comparación exacta (moderación, sets_insignias) la rechazaban -- la misma
 * clase de bug que N7. Se añade `isSystemRole` para que 'admin' también dé acceso a
 * `/admin/system/*`, coherente con que el titular es la única persona que gestiona el proyecto y
 * no quiere mantener una identidad de sysadmin separada (mismo criterio que D2). La migración
 * `20260819100000_validar_role_usuarios_perfil.sql` añade además una restricción en la base de
 * datos para que un valor mal formado como el de este caso no pueda volver a guardarse.
 */
export const MODERATOR_ROLES = ["admin", "admin_exposiciones"] as const;
export const SYSTEM_ROLES = ["admin", "sysadmin"] as const;

export function isModeratorRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (MODERATOR_ROLES as readonly string[]).includes(role);
}

export function isSystemRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (SYSTEM_ROLES as readonly string[]).includes(role);
}
