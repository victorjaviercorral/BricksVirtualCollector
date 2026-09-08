import { describe, it, expect, vi, beforeEach } from "vitest";
import ParticipacionDetalleRedirectPage from "./page";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("redirect");
  }),
}));

describe("/dashboard/participaciones/[id] (ruta movida)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserva el id al redirigir, para que un enlace antiguo lleve al mismo reclamo", async () => {
    await expect(
      ParticipacionDetalleRedirectPage({ params: Promise.resolve({ id: "reclamo-123" }) })
    ).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith("/dashboard/insignias/bounty/reclamo-123");
  });
});
