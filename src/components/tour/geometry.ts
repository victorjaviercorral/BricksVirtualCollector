// Geometría pura del overlay del tour: colocación del tooltip respecto al objetivo resaltado.
// Se aísla del componente para poder probar todas las ramas sin DOM.

import type { TourPlacement } from "./steps";

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type ResolvedPlacement = "top" | "bottom" | "left" | "right";

const EDGE = 16;

/**
 * Elige la colocación efectiva del tooltip. Respeta la preferencia si cabe; si no, cae a la
 * vertical con más espacio.
 */
export function resolvePlacement(
  rect: Rect,
  tip: Size,
  vp: Viewport,
  preferred: TourPlacement | undefined,
  margin: number
): ResolvedPlacement {
  const pref = preferred ?? "auto";
  const spaceBelow = vp.height - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const spaceRight = vp.width - (rect.left + rect.width);
  const spaceLeft = rect.left;
  const needV = tip.h + margin + EDGE;
  const needH = tip.w + margin + EDGE;

  if (pref === "left" && spaceLeft > needH) return "left";
  if (pref === "right" && spaceRight > needH) return "right";
  if (pref === "top" && spaceAbove > needV) return "top";
  if (pref === "bottom" && spaceBelow > needV) return "bottom";

  return spaceBelow > needV ? "bottom" : "top";
}

/** Posición absoluta (fixed) del tooltip, ya recortada al viewport. */
export function computeTooltipPosition(
  rect: Rect | null,
  tip: Size,
  vp: Viewport,
  preferred: TourPlacement | undefined,
  isMobile: boolean,
  margin: number
): { top: number; left: number; fullWidth: boolean } {
  if (isMobile) {
    return { top: Math.max(EDGE, vp.height - tip.h - EDGE), left: EDGE, fullWidth: true };
  }
  if (!rect) {
    return {
      top: Math.max(EDGE, (vp.height - tip.h) / 2),
      left: Math.max(EDGE, (vp.width - tip.w) / 2),
      fullWidth: false,
    };
  }

  const placement = resolvePlacement(rect, tip, vp, preferred, margin);
  let top = 0;
  let left = 0;
  if (placement === "top") {
    top = rect.top - tip.h - margin;
    left = rect.left + rect.width / 2 - tip.w / 2;
  } else if (placement === "bottom") {
    top = rect.top + rect.height + margin;
    left = rect.left + rect.width / 2 - tip.w / 2;
  } else if (placement === "left") {
    left = rect.left - tip.w - margin;
    top = rect.top + rect.height / 2 - tip.h / 2;
  } else {
    left = rect.left + rect.width + margin;
    top = rect.top + rect.height / 2 - tip.h / 2;
  }

  left = Math.max(EDGE, Math.min(left, vp.width - tip.w - EDGE));
  top = Math.max(EDGE, Math.min(top, vp.height - tip.h - EDGE));
  return { top, left, fullWidth: false };
}
