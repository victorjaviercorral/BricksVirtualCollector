import { describe, it, expect } from "vitest";
import { TOUR_STEPS, TOUR_STORAGE_KEY } from "./steps";

const KNOWN_ROUTES = new Set([
  "/dashboard",
  "/dashboard/vitrinas",
  "/mesa-de-trabajo",
]);

describe("TOUR_STEPS", () => {
  it("define una clave de almacenamiento versionada", () => {
    expect(TOUR_STORAGE_KEY).toBe("bvc_tour_v1");
  });

  it("tiene al menos un paso y ninguno vacío", () => {
    expect(TOUR_STEPS.length).toBeGreaterThan(0);
    for (const step of TOUR_STEPS) {
      expect(step.id.trim()).not.toBe("");
      expect(step.title.trim()).not.toBe("");
      expect(step.body.trim()).not.toBe("");
      expect(KNOWN_ROUTES.has(step.route)).toBe(true);
    }
  });

  it("usa identificadores únicos", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("empieza y termina en el Hub (recorrido circular)", () => {
    expect(TOUR_STEPS[0].route).toBe("/dashboard");
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].route).toBe("/dashboard");
  });

  it("cada selector de objetivo es un atributo data-tour o null", () => {
    for (const step of TOUR_STEPS) {
      if (step.target !== null) {
        expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
      }
    }
  });
});
