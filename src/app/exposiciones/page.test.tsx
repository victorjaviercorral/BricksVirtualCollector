import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ExposicionesIndexPage from "./page";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function mockSupabase(data: unknown[] | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data }),
      }),
    }),
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("ExposicionesIndexPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista las exposiciones con las activas primero y enlaza cada una a su ficha", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase([
        { id: "arch", titulo: "La Archivada", descripcion: "d", estado: "archivada", es_continua: true },
        { id: "act", titulo: "La Activa", descripcion: "d", estado: "activa", es_continua: true },
      ])
    );

    const jsx = await ExposicionesIndexPage();
    render(jsx);

    const enlaces = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/exposicion/"));
    expect(enlaces.map((a) => a.getAttribute("href"))).toEqual(["/exposicion/act", "/exposicion/arch"]);
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.getByText("Ver ranking")).toBeInTheDocument();
    expect(screen.getByText("Ver palmarés")).toBeInTheDocument();
  });

  it("estado vacío cuando no hay exposiciones (data null)", async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase(null));
    const jsx = await ExposicionesIndexPage();
    render(jsx);
    expect(screen.getByText("Todavía no hay exposiciones.")).toBeInTheDocument();
  });
});
