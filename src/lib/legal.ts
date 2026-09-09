/**
 * Versiones de los textos legales que el usuario acepta al entrar.
 *
 * - `TERMS_VERSION`: la que acepta explícitamente (checkbox) quien crea una cuenta real en
 *   `/registro`. Se guarda en `usuarios_perfil.consentimiento_version` vía el trigger
 *   `handle_new_user()` (lee `raw_user_meta_data.terms_version`).
 * - `GUEST_TERMS_VERSION`: la que acepta de forma tácita —al pulsar "entrar"— quien usa el modo
 *   invitado. NO es consentimiento RGPD (un invitado no aporta datos personales; ver ADR-011
 *   §"Consentimiento y aceptación"); es aceptación del contrato de uso. Se registra solo en
 *   `auth.users.raw_user_meta_data.guest_terms_version` como rastro de auditoría — el trigger
 *   deja `consentimiento_version` a null para invitados a propósito.
 *
 * Al publicar una versión nueva de los textos legales, subir el número aquí.
 */
export const TERMS_VERSION = 'v1.0';
export const GUEST_TERMS_VERSION = 'invitado-v1';
