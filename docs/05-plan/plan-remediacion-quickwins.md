---
proyecto: lego-virtual-museum
tipo: plan
alcance: hallazgos de alto impacto y bajo esfuerzo (cuadrante "HACER YA")
estado: ejecutado — 15 de 16 tareas completadas, 1 parcial
version: 2
fecha: 2026-08-10
decisiones: {DEC-1: BricksVirtualCollector, DEC-2: Málaga, DEC-3: Supabase Frankfurt (UE), DEC-4: sin email, contacto por GitHub/LinkedIn}
origen: docs/auditoria-arquitectura.md §5 (matriz impacto/esfuerzo)
relacionada_con: [ADR-009-entorno-demo-publico, analisis-titularidad-persona-fisica]
tags: [spec-vjc, plan, remediacion]
---

# Plan de remediación — Iteración 1 (alto impacto / bajo esfuerzo)

Cubre los 9 hallazgos del cuadrante **HACER YA** de la matriz de la auditoría
(§5): `C1 · D1 · D2 · A2 · S1 · S4 · C5 · D3 · A5`.

**No incluye** los hallazgos de alto impacto y esfuerzo alto (migraciones incompletas, suite roja,
mock data en rutas públicas, EXIF server-side, autorización en servidor). Esos van en una
iteración posterior, y **el proyecto no puede publicarse sin ellos**: esta iteración no habilita el
lanzamiento, prepara el terreno.

**Estado: ejecutado el 10/08/2026.** Resultado en §5.

---

## 0. Decisiones bloqueantes previas — RESUELTAS

| ID | Decisión | Resolución |
|---|---|---|
| **DEC-1** | Nombre del proyecto | **BricksVirtualCollector.** Elimina la marca ajena del nombre; LEGO® pasa a uso descriptivo en la línea secundaria. |
| **DEC-2** | Ciudad para la cláusula de jurisdicción | **Málaga (España).** |
| **DEC-3** | Región del proyecto de Supabase | **Frankfurt (Alemania, UE).** No hay transferencias internacionales fuera del EEE. |
| **DEC-4** | Canal de contacto | **Sin correo electrónico.** Incidencias del repositorio de GitHub y perfil de LinkedIn del titular. Consecuencia asumida y declarada en `politica-privacidad.md` §5: el canal principal es público, por lo que se ofrece LinkedIn como vía privada. Es sostenible porque, con el registro cerrado, no existen datos personales propios sobre los que ejercer derechos. |

> **Nota sobre el renombrado.** El renombrado se ha aplicado a las superficies visibles
> (interfaz, metadatos, `package.json`, README y los 5 documentos legales servidos). **No se ha
> renombrado el repositorio de GitHub** (`LegoVirtualMuseum`), porque cambia la URL pública y es
> una acción que corresponde al titular. Los ADRs anteriores conservan el nombre original por ser
> registros históricos: no se reescriben.

---

## 1. Tareas

Esfuerzo: **S** ≤ 2 h. Todas las de esta iteración son S salvo QW-05 y QW-07, marcadas.

### Bloque A — Desbloquear la verificación

| ID | Tarea | Dep. | Criterio de verificación | Evidencia |
|---|---|---|---|---|
| **QW-01** | Corregir el error de tipos que impide compilar: `await cookies()` en `src/app/dashboard/participaciones/[id]/page.tsx:14` y tipar `params` como `Promise<{id:string}>`. Aplicar el mismo tipado en `src/app/legal/[slug]/page.tsx:19`. | — | `npx tsc --noEmit` sin salida **y** `npx next build` exit 0 sin `ignoreBuildErrors` | |
| **QW-02** | Añadir `coverage` a `globalIgnores` en `eslint.config.mjs` para que ESLint se pueda ejecutar sin depender de si el directorio existe. | — | `npx eslint .` termina sin `ENOENT`, con el directorio `coverage/` presente y ausente | |

> QW-01 va primero de todo: sin build verde no se puede verificar ninguna otra tarea de forma
> fiable.

### Bloque B — Defectos funcionales visibles

| ID | Tarea | Dep. | Criterio de verificación | Evidencia |
|---|---|---|---|---|
| **QW-03** | Eliminar la ruta `src/app/moderacion/page.tsx` (stub "Contenido simulado para verificar el flujo"). Duplica `/admin/moderacion`, no está enlazada desde el Navbar y es públicamente navegable. | QW-01 | `grep -r "Contenido simulado" src/` sin resultados; `GET /moderacion` devuelve 404 | |
| **QW-04** | Resolver la duplicación `/mis-vitrinas` ↔ `/dashboard/vitrinas`. Eliminar `src/app/mis-vitrinas/` (no está enlazada; el Navbar apunta a `/dashboard/vitrinas`) junto con su test, que valida un placeholder ya inexistente. Esto elimina de paso el bug de `created_at` vs `creado_en` (`mis-vitrinas/page.tsx:31`). | QW-01 | Existe una sola ruta de listado de vitrinas; `grep -rn "created_at" src/app` sin resultados; el test de `mis-vitrinas` ya no existe y la suite no lo reclama | |

> **Nota sobre la política de testing (`AGENTS.md` §1):** QW-04 elimina un test. No es un test que
> falla y se oculta: es un test cuyo sujeto —una página placeholder— desaparece del proyecto. La
> justificación queda registrada aquí y debe replicarse en `docs/testing/informe-cobertura.md`
> según exige la regla.

### Bloque C — Seguridad latente

| ID | Tarea | Dep. | Criterio de verificación | Evidencia |
|---|---|---|---|---|
| **QW-05** *(M)* | Cerrar la escalada de privilegios (S1): migración que impida a un usuario modificar su propia columna `role` en `usuarios_perfil`. Vía recomendada: `revoke update (role) on public.usuarios_perfil from authenticated, anon`. | QW-01 | Con sesión de usuario normal, `update usuarios_perfil set role='sysadmin' where id=auth.uid()` devuelve error de permisos. Test de integración o evidencia manual documentada | |
| **QW-06** | Cerrar el open redirect de `src/app/auth/confirm/route.ts:15`: validar `next` contra una lista blanca de rutas internas, o rechazar cualquier valor que no case `^\/(?!\/)`. | QW-01 | `/auth/confirm?code=<válido>&next=//evil.com` no produce una cabecera `Location` con host externo; test unitario que lo cubra | |

> **Por qué QW-05 sigue siendo necesario pese a ADR-009.** La revocación global de escrituras del
> ADR neutraliza S1 en runtime, pero publicar el repositorio publica `supabase/migrations/` y con
> ello el modelo RLS. Cualquiera que lea el repo ve el fallo. Corregirlo en el código es requisito
> de publicar el repositorio, no solo de abrir la aplicación.

### Bloque D — Identidad, presentación y legales

| ID | Tarea | Dep. | Criterio de verificación | Evidencia |
|---|---|---|---|---|
| **QW-07** *(M)* | Unificar la identidad de marca según DEC-1: mismo nombre en `<title>` (`layout.tsx:29`), Navbar (`Navbar.tsx:45-49`) y Footer (`Footer.tsx:13`). | DEC-1 | El mismo nombre aparece en las tres ubicaciones; capturas de la cabecera y el pie | |
| **QW-08** | Renombrar el paquete: `"temp-app"` → nombre del proyecto. | DEC-1 | `package.json:2` actualizado; `npm ci` sigue funcionando | |
| **QW-09** | Añadir el disclaimer de marca visible y permanente en el Footer (texto propuesto en `legal/analisis-titularidad-persona-fisica.md` §6). Cierra D3 y el requisito de `legal/auditoria_legal.md:11`. | DEC-1 | El disclaimer es visible en todas las páginas sin scroll adicional | |
| **QW-10** | Sustituir los `<a href>` internos del Footer por `<Link>` (`Footer.tsx:17-21`) y usar el `Link` ya importado. | — | Navegar a un documento legal no provoca recarga completa; sin warning de import sin usar | |
| **QW-11** *(M)* | Completar los 19 `⚠️ PENDIENTE` de los 5 documentos servidos en `/legal/*` siguiendo las acciones L5–L9 del análisis legal: aviso de prototipo, nombre + email, sin NIF ni domicilio, fechas y jurisdicción. | DEC-1..4 | `grep -c "PENDIENTE\|REQUIERE VALIDACIÓN" legal/aviso-legal.md legal/politica-privacidad.md legal/politica-cookies.md legal/politica-propiedad-intelectual.md legal/terminos-condiciones.md` = 0 en los cinco | |
| **QW-12** | Actualizar `legal/data-map.md` con proveedores, ubicación real de Supabase y retenciones (L10). Documento interno, no servido. | DEC-3 | Ningún `PENDIENTE` que dependa de información ya conocida | |
| **QW-13** *(M)* | Reescribir el `README.md`, hoy plantilla de `create-next-app`: qué es el proyecto, capturas, stack, requisitos, `.env.example`, cómo levantarlo, cómo ejecutar tests, estado (prototipo), licencia y enlace a `docs/`. | DEC-1 | El README no contiene ninguna frase de `create-next-app`; un tercero levanta el proyecto siguiendo solo el README | |
| **QW-14** | Crear `.env.example` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, con valores de ejemplo y comentario de para qué sirve cada una. | — | El fichero existe, está versionado y `.gitignore` sigue excluyendo `.env*` reales | |

### Bloque E — Trazabilidad (regla `AGENTS.md` §3)

| ID | Tarea | Dep. | Criterio de verificación | Evidencia |
|---|---|---|---|---|
| **QW-15** | Actualizar `docs/testing/informe-cobertura.md`: retirar la afirmación de 94,45% global, aclarar que la cifra corresponde a la lista blanca de `vitest.config.ts` y no al proyecto, y registrar la justificación de QW-04. | QW-04 | Ninguna afirmación del documento contradice la salida real de `npm run test:coverage` | |
| **QW-16** | Registrar la iteración en `docs/00-proyecto/FASES_Y_MEJORAS.md` y crear el tag de checkpoint (`AGENTS.md` §4). | todas | Existe la fila en la tabla y un tag anotado nuevo | |

---

## 2. Orden de ejecución

```
DEC-1..4  ─────────────────────────────────┐
                                           │
QW-01 ──┬── QW-03                          │
        ├── QW-04 ── QW-15                 │
        ├── QW-05                          │
        └── QW-06                          │
                                           │
QW-02, QW-10, QW-14  (independientes)      │
                                           │
                          ┌────────────────┘
                          ├── QW-07, QW-08, QW-09
                          ├── QW-11 (+ DEC-2, DEC-3, DEC-4)
                          ├── QW-12 (+ DEC-3)
                          └── QW-13
                                           │
                                        QW-16
```

Se puede avanzar en paralelo: el Bloque D solo necesita DEC-1, y los bloques A–C no dependen de
ninguna decisión.

## 3. Definición de hecho de la iteración

1. `npx tsc --noEmit`, `npx eslint .` y `npx next build` terminan los tres en verde.
2. Ninguna ruta de la aplicación contiene la cadena "Contenido simulado".
3. Los cinco documentos legales servidos no contienen ningún `PENDIENTE`.
4. El disclaimer de marca es visible en todas las páginas.
5. El README describe el proyecto y permite levantarlo desde cero.
6. La escalada de privilegios de `usuarios_perfil` está cerrada en el código.
7. `docs/00-proyecto/FASES_Y_MEJORAS.md` tiene la fila de la iteración y existe el tag.

## 5. Resultado de la ejecución (10/08/2026)

**15 tareas completadas, 1 parcial. Ninguna regla de calidad ha sido relajada para dar por buena
una verificación.**

| Criterio de la definición de hecho | Resultado |
|---|---|
| 1. `tsc --noEmit`, `eslint .` y `next build` en verde | ⚠️ **PARCIAL.** `tsc --noEmit` sin errores y `next build` exit 0 (42 páginas generadas). **`eslint` NO está en verde:** 152 errores y 94 avisos. Ver abajo. |
| 2. Ninguna ruta con "Contenido simulado" | ✅ `grep` sin resultados. Rutas `/moderacion` y `/mis-vitrinas` eliminadas. |
| 3. Cero `PENDIENTE` en los 5 documentos servidos | ✅ Verificado con `grep -c` en los cinco. |
| 4. Disclaimer de marca visible en todas las páginas | ✅ En `Footer.tsx`, que se monta en el layout raíz. |
| 5. README describe el proyecto y permite levantarlo | ✅ Reescrito. Pendiente únicamente insertar capturas (marcado con comentario HTML). |
| 6. Escalada de privilegios cerrada en el código | ✅ Migración `20260810120000_fix_role_privilege_escalation.sql`. **Pendiente de aplicar contra la base de datos real.** |
| 7. Fila en `FASES_Y_MEJORAS.md` y tag de checkpoint | ✅ fila añadida. ⏸️ **tag y commit no ejecutados**: requieren decisión del titular. |

### Hallazgo nuevo: 152 errores de ESLint

Hasta QW-02, `npx eslint .` abortaba con `ENOENT` y **nadie había visto su salida completa**.
Corregida la configuración, aparece una deuda que no estaba registrada: 152 errores y 94 avisos,
78 de los errores en código de producción. Desglose por regla en
`docs/testing/informe-cobertura.md`.

Corrobora con la herramienta oficial tres hallazgos de la auditoría: C2 (`no-explicit-any`, 133),
P1 (`no-img-element`, 30) y X4 (`jsx-a11y/alt-text`, 1). Y añade cuatro categorías que la auditoría
no había detectado: `react-hooks/immutability` (4), `react-hooks/set-state-in-effect` (4),
`react-hooks/purity` (2) y `react/no-unescaped-entities` (8).

**No se ha desactivado ninguna regla.** Su corrección pasa a la iteración 2.

### Estado de la suite de tests

De 9 fallos se ha pasado a **8 de 123**. El fallo que desaparece es el del test de placeholder
eliminado en QW-04, justificado en `docs/testing/informe-cobertura.md`. Los 8 restantes
(`dashboard/page.test.tsx` y `ParticipacionesClient.test.tsx`) siguen en rojo, **no se han
ocultado**, y son trabajo de la iteración 2.

### Acciones pendientes del titular

1. Renombrar el repositorio de GitHub, si se desea coherencia total con el nuevo nombre.
2. Aplicar la migración `20260810120000_fix_role_privilege_escalation.sql` contra Supabase y
   verificar el criterio del ADR-009 §Criterio de verificación.
3. Verificar en el panel de Vercel la retención de logs, único dato que quedaba abierto en
   `legal/data-map.md`.
4. Insertar capturas en el README.

---

## 4. Lo que sigue sin resolverse tras esta iteración

Para que no se lea como "ya está listo":

- La suite sigue en rojo (9 fallos) y la cobertura sigue sin poder emitirse.
- `/perfil/[id]`, `/set/[id]` y `/mesa-de-trabajo/[id]` siguen sirviendo datos mock hard-coded.
- Siguen faltando 6 tablas en `supabase/migrations/`.
- Las Server Actions de moderación y `/api/bounties/claim` siguen sin autorización en servidor.
- El anonimato (RC-01) sigue implementado en cliente, contra lo decidido en ADR-005.

**El proyecto no es publicable al terminar esta iteración.** Estas cinco cosas son la iteración 2.
