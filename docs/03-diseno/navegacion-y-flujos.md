---
proyecto: bricks-virtual-collector
tipo: diseno
subtipo: arquitectura-de-navegacion
estado: implementado
version: 1
fecha: 2026-09-06
relacionada_con: [exposiciones-y-logros-flujo, plan-intervencion-post-iteracion-3, ADR-009-entorno-demo-publico]
tags: [spec-vjc, diseno, navegacion, zero-duplication, flujos-de-usuario]
---

# Arquitectura de navegación y flujos de usuario

**Origen:** segunda batería de correcciones de flujo (06/09/2026). Tras H5 el titular detectó
que seguía habiendo CTAs sin destino, secciones huérfanas (sin entrada en la navegación) y
flujos duplicados. Este documento fija el modelo para que no vuelva a divergir.

## Los dos contextos

| Contexto | Qué es | Secciones |
|---|---|---|
| **Explorar** | Contenido público navegable. Visible con o sin sesión (las *acciones* dentro siguen exigiendo sesión vía RLS y comprobaciones de servidor). | `/exposiciones` · `/exposicion/[id]` · `/bounties` · `/galeria` · `/vitrina/[id]` · `/set/[id]` · `/perfil/[id]` |
| **Mi Museo** | Lo del usuario. Tras la puerta de sesión (`middleware.ts`). | `/dashboard` (Hub) · `/dashboard/vitrinas` · `/dashboard/participaciones` ("Mi Progreso") · `/dashboard/insignias` ("Mis Insignias") · `/mesa-de-trabajo` · `/dashboard/perfil` |

## Regla de navegación

> **Toda sección de "Explorar" tiene entrada propia en la navbar** (menú "Explorar"). Las
> celdas del Hub y las tarjetas de la home son *atajos* hacia esas secciones, nunca la única
> puerta.

- Navbar logueado: `Inicio · Mis Vitrinas · Mi Progreso · Mis Insignias · Explorar ▾ · Cómo funciona`
- Navbar sin sesión: `Explorar ▾ · Cómo funciona · Entrar` (la home se alcanza por el logo)
- `Explorar ▾` = Exposiciones · Bounties · Galería

## Fuentes de verdad (una pantalla por concepto)

| Concepto | Pantalla canónica | Todo lo demás |
|---|---|---|
| Resultado de una exposición | `/exposicion/[id]` (live si activa, oficial de `sets_insignias` si archivada) | enlaza aquí — ver [[exposiciones-y-logros-flujo]] |
| Reclamar un bounty | `BountiesSectionClient` (tablero + modal: reclamar con set existente **o** subir nuevo, multi-reclamo) usado en `/bounties` y como teaser en la home | Se eliminó `BountiesClient` (implementación paralela con el modelo de un solo ganador que D1 retiró y sin flujo de reclamo real) |
| Histórico personal de exposiciones | `/dashboard/insignias` → Pasaporte | "Mi Progreso" enlaza aquí, no lo re-pinta |
| Bricks recibidos (agregado) | `/dashboard/participaciones` ("Mi Progreso") | la celda del Hub enlaza aquí |
| Explorar vitrinas de la comunidad | `/galeria` (índice con filtro por temática) | "Explorador de Vitrinas" y "Ver Galería Completa" de la home, celda "Comunidad" del Hub |

## Conexiones de la home (`/`)

Cada tarjeta del bento tiene destino real:

| Tarjeta | Destino |
|---|---|
| Banner exposición activa | `/exposicion/[id]` |
| Bounties Comunitarios (teaser, ya no abre modal) | `/bounties` |
| "Privacidad — Tú tienes el control total" | `/como-funciona` |
| "Organización — Tags & Categorías" | `/galeria` (filtro por temática) |
| "Estadísticas Detalladas" | `/dashboard/participaciones` (Mi Progreso) |
| "Explorador de Vitrinas" | `/galeria` |
| "Ver Galería Completa" | `/galeria` |
| Vitrinas Destacadas | `/vitrina/[id]` |

## Conexiones del Hub (`/dashboard`)

| Celda | Destino | Nota |
|---|---|---|
| Evento Activo | `/exposicion/[activa]` | |
| Bricks Recibidos | `/dashboard/participaciones` | antes: número no clicable |
| Última Insignia | `/dashboard/insignias` | |
| Más Eventos | `/exposiciones` | antes: solo a la 2ª expo activa, o texto muerto |
| Comunidad | `/galeria` | antes: `/dashboard/vitrinas` (era "mis vitrinas") |
| Mis Vitrinas | `/dashboard/vitrinas` | |
| Se Busca (Bounties) | `/bounties` | antes: `/dashboard/participaciones` |

## Deuda de navegación pendiente (no en este alcance)

- **3 vistas de vitrina** (`/vitrina/[id]`, `/v/[id]`, `/dashboard/vitrina/[id]`) sin
  consolidar — F2.6 de `docs/auditoria-arquitectura.md`.
- **No hay visor 3D real**: `/vitrina/[id]` es una rejilla 2D. La home ya no promete "gira,
  acerca" — dice "recorre las colecciones".
- **`/exposicion` y `/exposiciones` pasan a ser públicas** en `middleware.ts`. Consistente con
  `/bounties` y `/vitrina`. Si ADR-009 decide cerrar todo el contenido tras login, revertir
  esa línea es suficiente.
