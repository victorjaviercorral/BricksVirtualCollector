import { describe, it, expect } from "vitest";
import { resolvePlacement, computeTooltipPosition, type Rect } from "./geometry";

const VP = { width: 1000, height: 800 };
const TIP = { w: 320, h: 200 };
const M = 14;

// Objetivo centrado con espacio de sobra en todas direcciones.
const centered: Rect = { top: 350, left: 400, width: 200, height: 100 };

describe("resolvePlacement", () => {
  it("respeta la preferencia 'bottom' si hay espacio debajo", () => {
    expect(resolvePlacement(centered, TIP, VP, "bottom", M)).toBe("bottom");
  });

  it("respeta 'top' si hay espacio encima", () => {
    expect(resolvePlacement(centered, TIP, VP, "top", M)).toBe("top");
  });

  it("respeta 'left' y 'right' si cabe horizontalmente", () => {
    expect(resolvePlacement(centered, TIP, VP, "left", M)).toBe("left");
    expect(resolvePlacement(centered, TIP, VP, "right", M)).toBe("right");
  });

  it("cae a 'top' cuando 'bottom' no cabe (objetivo pegado abajo)", () => {
    const low: Rect = { top: 720, left: 400, width: 200, height: 60 };
    expect(resolvePlacement(low, TIP, VP, "bottom", M)).toBe("top");
  });

  it("cae a 'bottom' cuando 'top' no cabe (objetivo pegado arriba)", () => {
    const high: Rect = { top: 10, left: 400, width: 200, height: 40 };
    expect(resolvePlacement(high, TIP, VP, "top", M)).toBe("bottom");
  });

  it("con 'auto' elige la vertical con más espacio", () => {
    const high: Rect = { top: 20, left: 400, width: 200, height: 40 };
    expect(resolvePlacement(high, TIP, VP, "auto", M)).toBe("bottom");
    const low: Rect = { top: 700, left: 400, width: 200, height: 80 };
    expect(resolvePlacement(low, TIP, VP, undefined, M)).toBe("top");
  });

  it("'left' preferido pero sin hueco a la izquierda -> vertical", () => {
    const nearLeft: Rect = { top: 350, left: 20, width: 100, height: 100 };
    expect(resolvePlacement(nearLeft, TIP, VP, "left", M)).toBe("bottom");
  });

  it("'right' preferido pero sin hueco a la derecha -> vertical", () => {
    const nearRight: Rect = { top: 350, left: 880, width: 100, height: 100 };
    expect(resolvePlacement(nearRight, TIP, VP, "right", M)).toBe("bottom");
  });
});

describe("computeTooltipPosition", () => {
  it("en móvil ancla abajo a ancho completo", () => {
    const pos = computeTooltipPosition(centered, TIP, VP, "bottom", true, M);
    expect(pos.fullWidth).toBe(true);
    expect(pos.left).toBe(16);
    expect(pos.top).toBe(VP.height - TIP.h - 16);
  });

  it("sin objetivo (fallback) centra el tooltip", () => {
    const pos = computeTooltipPosition(null, TIP, VP, "bottom", false, M);
    expect(pos.fullWidth).toBe(false);
    expect(pos.left).toBeCloseTo((VP.width - TIP.w) / 2);
    expect(pos.top).toBeCloseTo((VP.height - TIP.h) / 2);
  });

  it("coloca debajo del objetivo y centrado horizontalmente", () => {
    const pos = computeTooltipPosition(centered, TIP, VP, "bottom", false, M);
    expect(pos.top).toBe(centered.top + centered.height + M);
    expect(pos.left).toBeCloseTo(centered.left + centered.width / 2 - TIP.w / 2);
  });

  it("coloca encima cuando la preferencia es 'top'", () => {
    const pos = computeTooltipPosition(centered, TIP, VP, "top", false, M);
    expect(pos.top).toBe(centered.top - TIP.h - M);
  });

  it("coloca a la izquierda / derecha centrado verticalmente", () => {
    const left = computeTooltipPosition(centered, TIP, VP, "left", false, M);
    expect(left.left).toBe(centered.left - TIP.w - M);
    const right = computeTooltipPosition(centered, TIP, VP, "right", false, M);
    expect(right.left).toBe(centered.left + centered.width + M);
  });

  it("recorta el tooltip a los bordes del viewport", () => {
    const edge: Rect = { top: 5, left: 5, width: 40, height: 40 };
    const pos = computeTooltipPosition(edge, TIP, VP, "left", false, M);
    expect(pos.top).toBeGreaterThanOrEqual(16);
    expect(pos.left).toBeGreaterThanOrEqual(16);
    expect(pos.left).toBeLessThanOrEqual(VP.width - TIP.w - 16);
  });
});
