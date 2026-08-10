# BricksVirtualCollector

**Museo virtual para coleccionistas de LEGO®.** Una plataforma donde exponer tu colección de sets
en vitrinas públicas o privadas, sin exponerte a ti: sin nombre real, sin mensajería directa y con
los metadatos EXIF de tus fotos eliminados antes de publicarlas.

> ### ⚠️ Estado: prototipo
>
> Este es un **prototipo de demostración técnica con fines de portfolio**. No es un producto
> comercial: no ofrece servicios de pago, no muestra publicidad y no admite el registro de nuevos
> usuarios. El contenido visible es ficticio.
>
> Su estado real —incluidos los defectos conocidos— está documentado sin maquillaje en
> [`docs/auditoria-arquitectura.md`](docs/auditoria-arquitectura.md). Si vienes a mirar el código,
> ese es el documento que da contexto.

<!--
  CAPTURAS: insertar aquí 2-3 imágenes o un GIF corto del recorrido
  (landing → vitrina pública → mesa de trabajo). Guardar en `public/screenshots/`.
-->

---

## Qué problema resuelve

Los coleccionistas quieren enseñar lo que construyen, pero las redes generalistas les obligan a
elegir entre visibilidad y privacidad. Una foto de una estantería lleva coordenadas GPS en los
metadatos y enseña el salón de tu casa. BricksVirtualCollector parte de una premisa distinta:
**el anonimato no es una opción de configuración, es el diseño**.

- Perfiles seudónimos: no se pide ni se muestra el nombre real.
- Sin mensajería directa entre usuarios: se elimina el vector de acoso.
- Limpieza de metadatos EXIF/GPS en las fotos subidas.
- Visibilidad por vitrina: pública, privada o accesible solo con enlace.

## Cómo está construido

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) · React 19 |
| Lenguaje | TypeScript en modo `strict` |
| Estilos | Tailwind CSS v4 (configuración CSS-first con `@theme`) |
| Backend | Supabase — PostgreSQL, Auth y Storage, con RLS en todas las tablas |
| Edge | `src/proxy.ts` (convención Next 16, sustituye a `middleware.ts`) |
| Tests | Vitest + Testing Library (unitarios) · Playwright (E2E) |
| CI | GitHub Actions con umbral de cobertura |

```
src/
├── app/            Rutas (App Router). Server Components por defecto.
│   ├── api/        Route handlers
│   ├── admin/      Panel de administración y observabilidad
│   └── legal/      Documentos legales renderizados desde /legal
├── components/     Componentes de cliente compartidos
├── lib/            Clientes de Supabase, logger, rate limiting, lectura de docs
└── proxy.ts        Rate limiting + sesión + protección de rutas
supabase/migrations/  Esquema y políticas RLS
docs/                 Documentación del proyecto (ver más abajo)
legal/                Textos legales servidos en /legal/[slug]
```

## Puesta en marcha

**Requisitos:** Node.js 20+ y un proyecto de [Supabase](https://supabase.com).

```bash
git clone https://github.com/victorjaviercorral/LegoVirtualMuseum.git
cd LegoVirtualMuseum
npm ci
cp .env.example .env.local   # rellena los valores de tu proyecto Supabase
npx supabase db push         # aplica las migraciones
npm run dev
```

La aplicación queda en `http://localhost:3000`.

> **Aviso:** las migraciones de `supabase/migrations/` **no reproducen todavía el esquema
> completo** — faltan las tablas del módulo de exposiciones e insignias. Está registrado como
> hallazgo A1 de la auditoría y es trabajo pendiente. Hasta que se cierre, un clon limpio arranca
> pero algunas secciones fallarán.

### Comandos

```bash
npm run dev             # servidor de desarrollo
npm run build           # build de producción
npm run lint            # ESLint
npm test                # tests unitarios
npm run test:coverage   # tests + informe de cobertura (umbral 85%)
npm run test:e2e        # tests end-to-end con Playwright
```

## Documentación

El proyecto se gestiona con el
[Spec VJC Framework](https://github.com/victorjaviercorral/spec-vjc-framework), que separa la
definición de la implementación y deja rastro de cada decisión.

| Documento | Contenido |
|---|---|
| [Auditoría de arquitectura](docs/auditoria-arquitectura.md) | Estado real del proyecto: hallazgos con evidencia, severidad y plan por fases |
| [Historial de fases](docs/00-proyecto/FASES_Y_MEJORAS.md) | Registro de trazabilidad de todas las iniciativas |
| [Especificación](docs/02-spec/spec.md) | Requisitos técnicos derivados del PRD |
| [Decisiones (ADR)](docs/06-decisiones/) | 9 registros de decisión con alternativas descartadas |
| [Guía de usuario](docs/09-guia-usuario/) | 12 secciones, servidas en `/como-funciona` |
| [Estrategia de testing](docs/testing/) | Política de cobertura y diagnóstico |
| [Textos legales](legal/) | Aviso legal, privacidad, cookies, términos y propiedad intelectual |

Las reglas de trabajo del repositorio —política de testing, consolidación sin duplicación,
documentación continua y versionado— están en [`AGENTS.md`](./AGENTS.md) y son de obligado
cumplimiento para cualquier persona o agente que contribuya.

## Marcas y licencia

**Proyecto independiente sin ánimo de lucro. No está afiliado, patrocinado ni avalado por The LEGO
Group.** LEGO® es una marca registrada de The LEGO Group, que no patrocina, autoriza ni avala este
sitio. Los diseños oficiales de sets, minifiguras y el formato del brick son propiedad intelectual
de The LEGO Group.

El código se distribuye bajo licencia [Apache 2.0](LICENSE).

---

Desarrollado por **Víctor Javier Corral** desde Málaga.
Para incidencias sobre el proyecto, abre una
[issue en GitHub](https://github.com/victorjaviercorral/LegoVirtualMuseum/issues).
