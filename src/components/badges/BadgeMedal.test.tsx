import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BadgeMedal, { ICONOS, nombreTramo, textoProgreso } from "./BadgeMedal";
import {
  CATALOGO_POR_SLUG,
  FAMILIAS,
  UNICAS,
  type InsigniaEvaluada,
} from "@/lib/insignias-usuario";

const insignia = (over: Partial<InsigniaEvaluada> = {}): InsigniaEvaluada => ({
  id: "cantera-2",
  nombre: "Cubo Lleno",
  familia: "Cantera",
  criterio: "Suma de piezas de todos tus sets",
  eje: "coleccion",
  icono: "Blocks",
  tramo: 2,
  desbloqueada: false,
  progreso: { valor: 2480, objetivo: 5000, unidad: "piezas" },
  ...over,
});

describe("mapa de iconos", () => {
  it("todas las familias del catálogo declaran un icono que existe en el mapa", () => {
    FAMILIAS.forEach((f) => {
      expect(ICONOS[f.icono], `familia ${f.id} declara el icono "${f.icono}"`).toBeDefined();
    });
  });

  it("todas las insignias únicas declaran un icono que existe en el mapa", () => {
    UNICAS.forEach((u) => {
      expect(ICONOS[u.icono], `insignia ${u.id} declara el icono "${u.icono}"`).toBeDefined();
    });
  });

  it("cualquier slug del catálogo se puede pintar sin icono ausente", () => {
    Object.entries(CATALOGO_POR_SLUG).forEach(([slug, entrada]) => {
      expect(ICONOS[entrada.icono], `slug ${slug}`).toBeDefined();
    });
  });

  it("no sobra ningún icono en el mapa: todos los declarados se usan", () => {
    const usados = new Set(Object.values(CATALOGO_POR_SLUG).map((e) => e.icono));
    Object.keys(ICONOS).forEach((nombre) => expect(usados.has(nombre)).toBe(true));
  });
});

describe("nombreTramo", () => {
  it("traduce el nivel a número romano", () => {
    expect(nombreTramo(1)).toBe("I");
    expect(nombreTramo(5)).toBe("V");
  });

  it("una insignia única no tiene nivel", () => {
    expect(nombreTramo(null)).toBeNull();
  });
});

describe("textoProgreso", () => {
  it("formatea el progreso con separador de miles español", () => {
    expect(textoProgreso(insignia())).toBe("2.480 / 5.000 piezas");
  });

  it("sin progreso devuelve null", () => {
    expect(textoProgreso(insignia({ progreso: null }))).toBeNull();
  });
});

describe("BadgeMedal", () => {
  it("pinta el nombre de la insignia y su familia", () => {
    render(<BadgeMedal insignia={insignia()} />);
    expect(screen.getByText("Cubo Lleno")).toBeInTheDocument();
    expect(screen.getByText("Cantera")).toBeInTheDocument();
  });

  it("una insignia bloqueada muestra siempre su progreso, nunca una casilla vacía", () => {
    render(<BadgeMedal insignia={insignia()} />);
    expect(screen.getByText("2.480 / 5.000 piezas")).toBeInTheDocument();
  });

  it("una insignia desbloqueada no muestra barra de progreso", () => {
    render(<BadgeMedal insignia={insignia({ desbloqueada: true })} />);
    expect(screen.queryByText("2.480 / 5.000 piezas")).not.toBeInTheDocument();
  });

  it("muestra el nivel como texto, no solo por color del aro", () => {
    render(<BadgeMedal insignia={insignia({ tramo: 3 })} />);
    expect(screen.getByText("III")).toBeInTheDocument();
  });

  it("una insignia única no muestra chip de nivel", () => {
    render(<BadgeMedal insignia={insignia({ id: "oro", nombre: "Oro", familia: "Oro", tramo: null, progreso: null })} />);
    expect(screen.queryByText("I")).not.toBeInTheDocument();
  });

  it("describe estado y progreso en el aria-label, para lectores de pantalla", () => {
    render(<BadgeMedal insignia={insignia()} />);
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Cubo Lleno, bloqueada, nivel II, 2.480 / 5.000 piezas"
    );
  });

  it("una desbloqueada se anuncia como tal, sin progreso en la etiqueta", () => {
    render(<BadgeMedal insignia={insignia({ desbloqueada: true })} />);
    expect(screen.getByRole("group")).toHaveAttribute("aria-label", "Cubo Lleno, desbloqueada, nivel II");
  });

  it("con mostrarProgreso desactivado (Mosaico) no pinta la barra", () => {
    render(<BadgeMedal insignia={insignia()} mostrarProgreso={false} />);
    expect(screen.queryByText("2.480 / 5.000 piezas")).not.toBeInTheDocument();
  });

  it("un icono desconocido no rompe el render: se pinta el resto de la medalla", () => {
    render(<BadgeMedal insignia={insignia({ icono: "IconoQueNoExiste" })} />);
    expect(screen.getByText("Cubo Lleno")).toBeInTheDocument();
  });
});
