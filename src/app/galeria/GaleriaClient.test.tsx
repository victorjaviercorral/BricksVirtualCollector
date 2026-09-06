import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GaleriaClient from "./GaleriaClient";
import type { VitrinaCruda } from "@/lib/galeria";

const vitrinas: VitrinaCruda[] = [
  {
    id: "sw",
    nombre: "Rincón Star Wars",
    descripcion: "naves",
    usuarios_perfil: { alias: "Vader" },
    sets: [{ id: "a", tematica: "Star Wars", fotos: [{ url: "http://cdn/a.jpg" }] }],
  },
  {
    id: "tech",
    nombre: "Solo Technic",
    descripcion: null,
    usuarios_perfil: { username: "eng" },
    sets: [{ id: "b", tematica: "Technic", fotos: [] }],
  },
];

describe("GaleriaClient", () => {
  it("lista todas las vitrinas y enlaza cada una a /vitrina/[id]", () => {
    render(<GaleriaClient vitrinas={vitrinas} temas={["Star Wars", "Technic"]} />);
    expect(screen.getByText("Rincón Star Wars").closest("a")).toHaveAttribute("href", "/vitrina/sw");
    expect(screen.getByText("Solo Technic").closest("a")).toHaveAttribute("href", "/vitrina/tech");
    expect(screen.getByText("@Vader")).toBeInTheDocument();
    expect(screen.getAllByText("1 set")).toHaveLength(2);
  });

  it("el filtro por temática reduce la lista", () => {
    render(<GaleriaClient vitrinas={vitrinas} temas={["Star Wars", "Technic"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Technic" }));
    expect(screen.queryByText("Rincón Star Wars")).not.toBeInTheDocument();
    expect(screen.getByText("Solo Technic")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getByText("Rincón Star Wars")).toBeInTheDocument();
  });

  it("estado vacío sin vitrinas", () => {
    render(<GaleriaClient vitrinas={[]} temas={[]} />);
    expect(screen.getByText("Todavía no hay vitrinas públicas.")).toBeInTheDocument();
  });

  it("estado vacío con mensaje propio cuando el filtro no casa con ninguna vitrina", () => {
    render(<GaleriaClient vitrinas={vitrinas} temas={["Star Wars", "Technic", "City"]} />);
    fireEvent.click(screen.getByRole("button", { name: "City" }));
    expect(screen.getByText("Ninguna vitrina con esa temática.")).toBeInTheDocument();
  });
});
