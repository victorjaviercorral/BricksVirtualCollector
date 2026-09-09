---
proyecto: bricks-virtual-collector
tipo: informe-testing
fecha: 2026-09-09
relacionada_con: [ADR-011-acceso-invitado-tres-niveles, plan-acceso-invitado-opcion-c]
---

# Cambio de expectativas en `src/app/login/page.test.tsx` (Fase 2 acceso de invitado)

La regla 1.2 de `AGENTS.md` exige documentar por qué se cambia la expectativa de un test cuando
el motivo no es un defecto detectado por el propio test. Este es el caso.

## Qué se ha eliminado del test

`login/page.test.tsx` tenía, hasta esta fase, casos que verificaban:

1. **Auto-registro implícito:** si `signInWithPassword` fallaba con `"Invalid login credentials"`,
   el componente llamaba a `supabase.auth.signUp(...)` con `terms_version: 'v1.0'` y redirigía al
   dashboard. Tests afectados: *"debe registrar al usuario si el login falla…"*, *"debe mostrar
   mensaje si el registro se completó pero requiere confirmación"*, *"debe mostrar mensaje de
   error si el registro falla"*.
2. **Checkbox de términos en el login:** *"debe mostrar error si no se aceptan los términos"* y
   los `fireEvent.click(screen.getByRole('checkbox', …))` en el resto de casos.

## Por qué el cambio NO es "arreglar un test que molesta"

El comportamiento que esos tests fijaban es exactamente el que el **ADR-011** (Fase 2) decide
retirar, por decisión de producto del titular (2026-09-09):

- El auto-registro implícito convierte cualquier email tecleado en una cuenta real sin que nadie
  lo decida — lo contrario del objetivo de "no convertir el sitio en una app con usuarios reales
  antes de tiempo". El registro pasa a ser una acción deliberada en `/registro`.
- Pedir aceptar la Política de Privacidad + Términos *para entrar* (no para registrarse) re-exige
  el consentimiento en cada login y difumina qué se está aceptando. El checkbox se mantiene, pero
  solo en `/registro`, donde sí se crea la cuenta.

Los tests eliminados no detectaban ningún defecto: describían fielmente el código de entonces.
Al cambiar la decisión de producto, la expectativa correcta cambia con ella.

## Qué cubre el test ahora

`login/page.test.tsx` (reescrito): render sin checkbox; login correcto → `/dashboard`;
`"Invalid login credentials"` → mensaje + enlace a `/registro` **sin** llamar a `signUp`; otros
errores se muestran tal cual; se ofrece "crear cuenta" y "probar sin registrarme".

El flujo de registro se cubre en `src/app/registro/page.test.tsx` (nuevo): checkbox obligatorio,
`signUp` con `terms_version: TERMS_VERSION`, aviso de confirmación por email, errores.

La entrada de invitado se cubre en `src/components/EntrarComoInvitado.test.tsx` (nuevo):
`signInAnonymously` con `guest_terms_version`, redirección, `toast` de error, botón deshabilitado.

## Resultado

Suite 579 → **589 tests** (+10), 73 ficheros. 4 métricas de cobertura ≥ 85%
(S 95,74 / B 88,28 / F 94,71 / L 96,84). `login/page.tsx` y los 4 ficheros nuevos al 100% en las
4 métricas. `tsc` limpio; `lint:ci` baja de 157 a **154** (la reescritura del test retira `any`
preexistente — baseline actualizado en el mismo PR); `next build` verde.
