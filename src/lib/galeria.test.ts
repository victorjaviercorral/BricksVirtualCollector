import { describe, it, expect } from "vitest";
import {
  PORTADA_RESERVA,
  temasDeVitrinas,
  tarjetaVitrina,
  filtrarVitrinasPorTema,
  type VitrinaCruda,
} from "./galeria";

const vitrina = (over: Partial<VitrinaCruda> = {}): VitrinaCruda => ({
  id: "v1",
  nombre: "Mi Vitrina",
  descripcion: "  una colección  ",
  usuarios_perfil: { username: "user", alias: "Alias" },
  sets: [
    { id: "s1", tematica: "Star Wars", fotos: [{ url: "http://cdn/1.jpg" }] },
    { id: "s2", tematica: "Technic", fotos: [] },
  ],
  ...over,
});

describe("temasDeVitrinas", () => {
  it("lista temáticas únicas y ordenadas, sin vacíos", () => {
    const temas = temasDeVitrinas([
      vitrina(),
      vitrina({ sets: [{ id: "s3", tematica: "  ", fotos: [] }, { id: "s4", tematica: "City", fotos: [] }] }),
    ]);
    expect(temas).toEqual(["City", "Star Wars", "Technic"]);
  });

  it("entrada nula -> lista vacía", () => {
    expect(temasDeVitrinas(null)).toEqual([]);
  });
});

describe("tarjetaVitrina", () => {
  it("deriva dueño (alias primero), portada del primer set con foto, recuento y temas", () => {
    const t = tarjetaVitrina(vitrina());
    expect(t.dueno).toBe("Alias");
    expect(t.portada).toBe("http://cdn/1.jpg");
    expect(t.numSets).toBe(2);
    expect(t.temas).toEqual(["Star Wars", "Technic"]);
    expect(t.descripcion).toBe("una colección");
  });

  it("sin fotos usa la portada de reserva; sin alias cae a username", () => {
    const t = tarjetaVitrina(
      vitrina({ usuarios_perfil: { username: "solo_user" }, sets: [{ id: "s1", tematica: null, fotos: [] }] })
    );
    expect(t.portada).toBe(PORTADA_RESERVA);
    expect(t.dueno).toBe("solo_user");
    expect(t.temas).toEqual([]);
  });

  it("resuelve usuarios_perfil aunque venga como array; descripción vacía -> null", () => {
    const t = tarjetaVitrina(vitrina({ usuarios_perfil: [{ alias: "EnArray" }], descripcion: "   " }));
    expect(t.dueno).toBe("EnArray");
    expect(t.descripcion).toBeNull();
  });

  it("sin dueño resoluble usa un texto neutro", () => {
    const t = tarjetaVitrina(vitrina({ usuarios_perfil: null }));
    expect(t.dueno).toBe("Coleccionista anónimo");
  });
});

describe("filtrarVitrinasPorTema", () => {
  const vs = [
    vitrina({ id: "sw", sets: [{ id: "a", tematica: "Star Wars", fotos: [] }] }),
    vitrina({ id: "tech", sets: [{ id: "b", tematica: "Technic", fotos: [] }] }),
    vitrina({ id: "mixta", sets: [{ id: "c", tematica: "Star Wars", fotos: [] }, { id: "d", tematica: "City", fotos: [] }] }),
  ];

  it("null o 'todas' devuelve todas", () => {
    expect(filtrarVitrinasPorTema(vs, null)).toHaveLength(3);
    expect(filtrarVitrinasPorTema(vs, "todas")).toHaveLength(3);
  });

  it("filtra por coincidencia de temática en cualquier set", () => {
    expect(filtrarVitrinasPorTema(vs, "Star Wars").map((v) => v.id)).toEqual(["sw", "mixta"]);
    expect(filtrarVitrinasPorTema(vs, "Technic").map((v) => v.id)).toEqual(["tech"]);
  });

  it("entrada nula -> lista vacía", () => {
    expect(filtrarVitrinasPorTema(null, "Star Wars")).toEqual([]);
  });
});
