import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GaleriaPage from "./page";
import { getVitrinasPublicas } from "@/lib/queries/vitrinas";

vi.mock("@/lib/queries/vitrinas", () => ({ getVitrinasPublicas: vi.fn() }));
vi.mock("./GaleriaClient", () => ({
  default: ({ vitrinas, temas }: { vitrinas: unknown[]; temas: string[] }) => (
    <div data-testid="galeria-client">
      <span data-testid="n">{vitrinas.length}</span>
      <span data-testid="temas">{temas.join(",")}</span>
    </div>
  ),
}));

describe("GaleriaPage (SSR)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pasa las vitrinas y deriva las temáticas para el filtro", async () => {
    vi.mocked(getVitrinasPublicas).mockResolvedValue([
      { id: "v1", nombre: "A", sets: [{ id: "s1", tematica: "Technic", fotos: [] }] },
      { id: "v2", nombre: "B", sets: [{ id: "s2", tematica: "City", fotos: [] }] },
    ] as never);

    render(await GaleriaPage());

    expect(screen.getByTestId("n")).toHaveTextContent("2");
    expect(screen.getByTestId("temas")).toHaveTextContent("City,Technic");
  });

  it("tolera lista vacía", async () => {
    vi.mocked(getVitrinasPublicas).mockResolvedValue([] as never);
    render(await GaleriaPage());
    expect(screen.getByTestId("n")).toHaveTextContent("0");
  });
});
