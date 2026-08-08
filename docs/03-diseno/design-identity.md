---
proyecto: lego-virtual-museum
tipo: diseno
estado: confirmado
version: 0.1
fecha: 2026-07-27
tags: [spec-vjc, diseno]
---

# Design Identity — Lego Virtual Museum

**Personalidad (3 adjetivos):** Visual, Adaptativo, Innovador.
**Referencias que gustan:** ninguna referencia externa aportada por el usuario; la direccion se construyo con `ui-ux-pro-max` (busqueda de estilos/paletas/tipografia) y se itero en 4 rondas hasta romper con los patrones ya vistos por el usuario.
**Prohibido / a evitar:** look generico de plantilla IA (gradiente violeta, glassmorphism generico, Inter/Space Grotesk usada de forma generica sin sistema propio); paleta oficial de marca LEGO (los 4 colores usados son hex propios, no el kit de marca); fondos "de mood" grisaceos o parchment/kraft (probados y rechazados en iteracion — ver historial abajo).
**Modo:** ambos (claro y oscuro), claro por defecto.
**Tono del copy:** amigable, cercano, geek, de aficionados a LEGO (AFOL — Adult Fans of LEGO), enfoque "brick", tono adulto y tech, casual.

## Direccion visual

- **Paleta** (hex propios, inspirados en plasticos de bloques clasicos, no el kit de marca oficial):
  - Ink `#101113` (texto/linea, claro) · Paper `#FFFFFF` (fondo, claro)
  - Ink `#F1F1EC` (texto/linea, oscuro) · Paper `#0B0B0C` (fondo, oscuro) · Panel `#17181A`
  - Rojo `#D6392E` / `#FF6B5C` (oscuro)
  - Amarillo `#E8A927` / `#F5C14B` (oscuro)
  - Azul `#2C6CA8` / `#6FA8DC` (oscuro)
  - Verde `#3F8552` / `#6BBF7E` (oscuro)
  - `[PENDIENTE: auditoria formal de contraste AA par por par con contenido real, en /prototype]`
- **Tipografia:** Space Grotesk (headings/display) + DM Sans (cuerpo) + IBM Plex Mono (datos/etiquetas — numeros de set, piezas, valores de token).
- **Motion / animaciones (con intencion, no decoracion):** manejo directo con seguimiento 1:1 del puntero (arrastre de tokens), momentum + rubber-banding en carrusel horizontal (formulas de proyeccion de velocidad y resistencia progresiva en los bordes), curvas de easing propias (no las nativas de CSS), entrada con pequeno rebote (metafora fisica de "encastre"), `prefers-reduced-motion` respetado atenuando en vez de eliminar. Basado en la combinacion obligatoria de las skills `emil-design-eng` + `apple-design` (constitution F.26-bis, ver CHANGELOG del framework v1.1.0).
- **Design system base:** ninguno existente aun. Este proyecto es candidato a convertirse en el primer design system reutilizable del framework (`/design-system`) una vez el prototipo real valide los tokens.

## Historial de iteracion (evidencia — constitution A.1/A.2)

Se generaron y descartaron 3 direcciones antes de confirmar la v4:

1. **v1 — Neubrutalismo:** bordes duros, sombra offset, papel cuadriculado, animacion de "encastre" con rebote. Base: busqueda `ui-ux-pro-max` (estilo "Neubrutalism", tipografia "Tech Startup" Space Grotesk/DM Sans). Descartada: el usuario ya habia visto mucho este patron, sentia repetitivo.
2. **v2 — Archivo/museo:** linea tecnica fina, diagrama de anatomia de pieza, tipografia serif de catalogo (Source Serif) + monoespaciada (IBM Plex Mono), un solo color de sello. Fondo probado en gris frio y luego en pergamino/kraft calido — ambos rechazados por el usuario. Descartada ademas por sentirse "demasiado sobria, poco geek".
3. **v3 — Fusion v1×v2:** fondo neutro puro (blanco/negro), 4 colores tipo ladrillo propios, diagrama tecnico con studs coloreados, tipografia Space Grotesk + DM Sans + Plex Mono. Revisada aplicando `emil-design-eng` (curvas de easing propias, gate de hover en tactil, feedback `:active`, reduced-motion que atenua) tras instalar esa skill.
4. **v4 — Sandbox interactivo (CONFIRMADA):** cambio de paradigma — la identidad se manipula, no se mira. Mesa de trabajo con tokens de diseno arrastrables (manejo directo, sin snap-back automatico, ajuste de inclinacion al soltar) y vitrina de sets con scroll de inercia real y rubber-banding en los bordes. Construida combinando `emil-design-eng` (pulido, performance, easing) y `apple-design` (fisicidad, momentum, interrumpibilidad) en la misma iteracion — ver retro distilada al framework (CHANGELOG spec-vjc-framework v1.1.0, seccion "Fusion con retro paralela [0.1.1]").

Mockup confirmado preservado en `docs/03-diseno/identity-mockup-v4.html` (autocontenido, sin dependencias externas).

`[PENDIENTE: aplicar esta identidad sobre contenido real del flujo principal en /prototype — este mockup usa datos de sets LEGO reales como muestra, no el flujo de la app]`
