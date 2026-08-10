# BricksVirtualCollector — Base documental

Museo virtual anonimo de colecciones LEGO. Proyecto gestionado con [Spec VJC Framework](https://github.com/victorjaviercorral/spec-vjc-framework).

**Repo de codigo:** https://github.com/victorjaviercorral/BricksVirtualCollector
**Estado:** MVP implementado (~7.500 líneas), en remediación post-auditoría previa a publicación
pública. Veredicto vigente: **NO-GO** — ver [[auditoria-arquitectura]].

> Esta tabla listaba las fases de definición como "Pendiente" cuando en realidad la
> implementación ya existía (~7.500 líneas de producción) sin que la documentación lo reflejara.
> Corregido el 10/08/2026 (hallazgo D6 de `docs/auditoria-arquitectura.md`).

## Fases
| Fase | Artefacto | Estado |
|------|-----------|--------|
| Inicializacion | [[00-proyecto/project]] · [[03-diseno/design-identity]] | Hecho |
| PRD-lite | [[01-prd/prd-lite]] | Hecho |
| Spec | [[02-spec/spec]] | Hecho (parcialmente desalineada con el código real — ver ADR-010) |
| Prototipo | `04-prototipo/prototype.html` | Hecho |
| Implementación (código) | `src/` (32 rutas, 4 API routes) | Hecho, con deuda documentada |
| Auditoría y remediación | [[auditoria-arquitectura]] · [[06-decisiones/ADR-009-entorno-demo-publico]] · [[05-plan/plan-remediacion-quickwins]] · [[05-plan/seguimiento-iteracion-1]] · [[05-plan/seguimiento-iteracion-2]] | En progreso |

## Insumos heredados del pipeline anterior
- PRD LegoVault v5 (CONDICIONAL 6.7): fuente principal para `/prd-lite`. Requisitos criticos ya identificados: anonimato (limpieza EXIF/GPS), sin mensajeria directa, moderacion con anonimato, umbral de migracion Supabase.
