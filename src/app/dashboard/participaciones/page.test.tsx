import { describe, it, expect, vi, beforeEach } from "vitest";
import ParticipacionesRedirectPage from "./page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("redirect");
  }),
}));

/**
 * Los tests que había aquí (cabecera "Mi Progreso", stats, exposiciones activas, "Dónde puedes
 * participar") NO se han eliminado por fallar: su comportamiento se reubicó al fusionar esta
 * pantalla en "Mis Insignias". Viven ahora en ActividadEnCurso.test.tsx, RecompensasGanadas.test.tsx,
 * InsigniasClient.test.tsx y DondePuedesParticipar.test.tsx. Documentado en
 * docs/testing/informe-cobertura.md.
 */
describe("/dashboard/participaciones (ruta fusionada)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirige a Mis Insignias en vez de dar 404: la ruta estuvo en marcadores", async () => {
    await expect(ParticipacionesRedirectPage()).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/dashboard/insignias");
  });
});
