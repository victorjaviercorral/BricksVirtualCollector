import { describe, it, expect } from "vitest";
import {
  AGREGADOS_VACIOS,
  CATALOGO_POR_SLUG,
  COLOR_POR_EJE,
  FAMILIAS,
  MAX_PROXIMOS_OBJETIVOS,
  TOTAL_INSIGNIAS,
  UNICAS,
  avisoPiezasIncompletas,
  evaluarInsignias,
  fraccionProgreso,
  slugTramo,
  slugsDesbloqueados,
  type AgregadosUsuario,
} from "./insignias-usuario";

const agregados = (over: Partial<AgregadosUsuario> = {}): AgregadosUsuario => ({
  ...AGREGADOS_VACIOS,
  ...over,
});

describe("integridad del catálogo", () => {
  it("cada familia tiene un nombre por tramo y umbrales estrictamente crecientes", () => {
    FAMILIAS.forEach((f) => {
      expect(f.tramos).toHaveLength(f.nombresTramo.length);
      expect(f.tramos.length).toBeGreaterThan(0);
      f.tramos.forEach((umbral, i) => {
        expect(umbral).toBeGreaterThan(0);
        if (i > 0) expect(umbral).toBeGreaterThan(f.tramos[i - 1]);
      });
    });
  });

  it("todos los slugs del catálogo son únicos", () => {
    const slugs = Object.keys(CATALOGO_POR_SLUG);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("el catálogo tiene 46 insignias: 40 de familias escalonadas y 6 únicas", () => {
    const niveles = FAMILIAS.reduce((acc, f) => acc + f.tramos.length, 0);
    expect(niveles).toBe(40);
    expect(UNICAS).toHaveLength(6);
    expect(TOTAL_INSIGNIAS).toBe(46);
  });

  it("cada eje declarado tiene un color de marca asignado", () => {
    [...FAMILIAS, ...UNICAS].forEach((entrada) => {
      expect(COLOR_POR_EJE[entrada.eje]).toMatch(/^brand-/);
    });
  });

  it("cada familia mide una métrica distinta: dos familias no compiten por el mismo dato", () => {
    const metricas = FAMILIAS.map((f) => f.metrica);
    expect(new Set(metricas).size).toBe(metricas.length);
  });
});

describe("slugTramo", () => {
  it("compone el identificador estable de un tramo", () => {
    expect(slugTramo("cantera", 3)).toBe("cantera-3");
  });
});

describe("evaluarInsignias — usuario recién registrado", () => {
  const r = evaluarInsignias(AGREGADOS_VACIOS);

  it("no desbloquea ninguna insignia", () => {
    expect(r.desbloqueadas).toHaveLength(0);
  });

  it("no propone ningún objetivo con barra: sin avance real no hay progreso que pintar", () => {
    expect(r.proximosObjetivos).toHaveLength(0);
  });

  it("lista las 11 familias y las 6 únicas como formas de empezar, en texto", () => {
    expect(r.otrasFamilias).toHaveLength(FAMILIAS.length + UNICAS.length);
  });
});

describe("evaluarInsignias — umbrales", () => {
  it("desbloquea exactamente al alcanzar el umbral, no antes", () => {
    expect(slugsDesbloqueados(agregados({ piezasTotales: 999 }))).not.toContain("cantera-1");
    expect(slugsDesbloqueados(agregados({ piezasTotales: 1000 }))).toContain("cantera-1");
  });

  it("un valor alto desbloquea todos los tramos inferiores de la familia", () => {
    const slugs = slugsDesbloqueados(agregados({ piezasTotales: 20000 }));
    expect(slugs).toContain("cantera-1");
    expect(slugs).toContain("cantera-2");
    expect(slugs).toContain("cantera-3");
    expect(slugs).not.toContain("cantera-4");
  });

  it("una familia completada deja de aparecer entre lo pendiente", () => {
    const r = evaluarInsignias(agregados({ piezasTotales: 200000 }));
    expect(r.desbloqueadas.filter((i) => i.id.startsWith("cantera-"))).toHaveLength(5);
    expect([...r.proximosObjetivos, ...r.otrasFamilias].some((i) => i.id.startsWith("cantera-"))).toBe(false);
  });

  it("propone solo el siguiente tramo pendiente de cada familia, no todos", () => {
    const r = evaluarInsignias(agregados({ numSets: 6 }));
    const pendientesColeccionista = [...r.proximosObjetivos, ...r.otrasFamilias].filter((i) =>
      i.id.startsWith("coleccionista-")
    );
    expect(pendientesColeccionista).toHaveLength(1);
    expect(pendientesColeccionista[0].id).toBe("coleccionista-3");
  });
});

describe("evaluarInsignias — reparto entre objetivos cercanos y lista de texto", () => {
  it("una familia con avance va a objetivos; una sin avance, a la lista de texto", () => {
    const r = evaluarInsignias(agregados({ numFotos: 3 }));
    expect(r.proximosObjetivos.map((i) => i.id)).toContain("retratista-1");
    expect(r.otrasFamilias.map((i) => i.id)).toContain("comisario-1");
  });

  it("ordena los objetivos de más cerca a más lejos de completarse", () => {
    // 4/5 fotos (80%) va por delante de 1/1000 piezas (0,1%).
    const r = evaluarInsignias(agregados({ numFotos: 4, piezasTotales: 1 }));
    expect(r.proximosObjetivos[0].id).toBe("retratista-1");
    expect(r.proximosObjetivos[1].id).toBe("cantera-1");
  });

  it(`nunca muestra más de ${MAX_PROXIMOS_OBJETIVOS} objetivos con barra`, () => {
    const r = evaluarInsignias(
      agregados({
        piezasTotales: 1,
        numSets: 0,
        tematicas: 1,
        bricksRecibidos: 0,
        bricksDados: 0,
        numVitrinasPublicadas: 0,
        numFotos: 1,
        exposicionesAprobadas: 0,
        bountiesReclamados: 0,
        bricksDeBounties: 1,
        diasDesdeRegistro: 1,
      })
    );
    expect(r.proximosObjetivos.length).toBeLessThanOrEqual(MAX_PROXIMOS_OBJETIVOS);
  });

  it("los objetivos que no caben en el tope no se pierden: van a la lista de texto", () => {
    const conAvanceEnTodo = agregados({
      piezasTotales: 1,
      numSets: 1,
      tematicas: 1,
      bricksRecibidos: 1,
      bricksDados: 1,
      numVitrinasPublicadas: 1,
      numFotos: 1,
      exposicionesAprobadas: 1,
      bountiesReclamados: 1,
      bricksDeBounties: 1,
      diasDesdeRegistro: 1,
    });
    const r = evaluarInsignias(conAvanceEnTodo);
    const pendientes = [...r.proximosObjetivos, ...r.otrasFamilias];
    // 11 familias, todas con avance y ninguna completa, + 6 únicas pendientes.
    expect(pendientes).toHaveLength(FAMILIAS.length + UNICAS.length);
    expect(r.proximosObjetivos).toHaveLength(MAX_PROXIMOS_OBJETIVOS);
  });
});

describe("evaluarInsignias — insignias únicas", () => {
  it("un podio de cada color desbloquea su insignia y la Triple Corona", () => {
    const slugs = slugsDesbloqueados(agregados({ oros: 1, platas: 2, bronces: 1 }));
    expect(slugs).toEqual(expect.arrayContaining(["oro", "plata", "bronce", "triple-corona"]));
  });

  it("sin las tres medallas no hay Triple Corona", () => {
    const slugs = slugsDesbloqueados(agregados({ oros: 3, platas: 5 }));
    expect(slugs).toContain("oro");
    expect(slugs).not.toContain("triple-corona");
  });

  it("Pieza Estrella depende del set más votado, no del total de bricks", () => {
    expect(slugsDesbloqueados(agregados({ bricksRecibidos: 500, maxBricksUnSet: 24 }))).not.toContain(
      "pieza-estrella"
    );
    expect(slugsDesbloqueados(agregados({ bricksRecibidos: 25, maxBricksUnSet: 25 }))).toContain(
      "pieza-estrella"
    );
  });

  it("Arqueólogo se otorga por tener un set anterior al 2000", () => {
    expect(slugsDesbloqueados(agregados({ setAntiguo: true }))).toContain("arqueologo");
    expect(slugsDesbloqueados(agregados({ setAntiguo: false }))).not.toContain("arqueologo");
  });

  it("las únicas no tienen progreso: no hay medio camino que pintar", () => {
    const r = evaluarInsignias(AGREGADOS_VACIOS);
    const unica = r.otrasFamilias.find((i) => i.id === "oro");
    expect(unica?.progreso).toBeNull();
    expect(unica?.tramo).toBeNull();
  });
});

describe("fraccionProgreso", () => {
  it("devuelve la fracción hacia el objetivo", () => {
    const r = evaluarInsignias(agregados({ numSets: 3 }));
    const objetivo = r.proximosObjetivos.find((i) => i.id === "coleccionista-2");
    expect(fraccionProgreso(objetivo!)).toBeCloseTo(3 / 5);
  });

  it("apunta al siguiente tramo pendiente, no al último alcanzado", () => {
    // 60 sets ya supera el tramo 4 (40); el objetivo vivo es el 5 (100) -> 60%.
    const r = evaluarInsignias(agregados({ numSets: 60 }));
    const objetivo = r.proximosObjetivos.find((i) => i.id === "coleccionista-5");
    expect(fraccionProgreso(objetivo!)).toBeCloseTo(0.6);
  });

  it("nunca supera 1, aunque le llegue una insignia ya superada", () => {
    // evaluarInsignias no produce este caso (el objetivo vivo siempre está por delante), pero
    // el Mosaico y las desbloqueadas sí pasan insignias cumplidas por esta función.
    const cumplida = evaluarInsignias(agregados({ numSets: 60 })).desbloqueadas.find(
      (i) => i.id === "coleccionista-1"
    );
    expect(fraccionProgreso(cumplida!)).toBe(1);
  });

  it("una insignia sin progreso (única) devuelve 0", () => {
    const r = evaluarInsignias(AGREGADOS_VACIOS);
    expect(fraccionProgreso(r.otrasFamilias.find((i) => i.id === "bronce")!)).toBe(0);
  });
});

describe("CATALOGO_POR_SLUG", () => {
  it("permite pintar una insignia del Mosaico conociendo solo su slug", () => {
    expect(CATALOGO_POR_SLUG["cantera-3"]).toEqual({
      nombre: "Cantera Propia",
      familia: "Cantera",
      eje: "coleccion",
      icono: "Blocks",
      tramo: 3,
    });
  });

  it("incluye las únicas, sin tramo", () => {
    expect(CATALOGO_POR_SLUG["triple-corona"].tramo).toBeNull();
    expect(CATALOGO_POR_SLUG["triple-corona"].icono).toBe("Crown");
  });

  it("un slug desconocido (fila antigua de otra versión del catálogo) no revienta", () => {
    expect(CATALOGO_POR_SLUG["insignia-que-no-existe"]).toBeUndefined();
  });

  it("cubre todos los slugs que puede emitir evaluarInsignias", () => {
    const todos = agregados({
      piezasTotales: 999999,
      numSets: 999,
      tematicas: 99,
      bricksRecibidos: 99999,
      bricksDados: 9999,
      numVitrinasPublicadas: 99,
      numFotos: 999,
      exposicionesAprobadas: 99,
      bountiesReclamados: 99,
      bricksDeBounties: 99999,
      diasDesdeRegistro: 9999,
      oros: 1,
      platas: 1,
      bronces: 1,
      maxBricksUnSet: 999,
      setAntiguo: true,
    });
    const slugs = slugsDesbloqueados(todos);
    expect(slugs).toHaveLength(TOTAL_INSIGNIAS);
    slugs.forEach((s) => expect(CATALOGO_POR_SLUG[s]).toBeDefined());
  });
});

describe("avisoPiezasIncompletas", () => {
  it("no avisa cuando todos los sets tienen el nº de piezas", () => {
    expect(avisoPiezasIncompletas(agregados({ numSets: 4, setsConPiezas: 4 }))).toBeNull();
  });

  it("avisa en singular con un solo set sin dato", () => {
    expect(avisoPiezasIncompletas(agregados({ numSets: 4, setsConPiezas: 3 }))).toContain("1 set no tiene");
  });

  it("avisa en plural con varios sets sin dato", () => {
    expect(avisoPiezasIncompletas(agregados({ numSets: 10, setsConPiezas: 4 }))).toContain("6 sets no tienen");
  });

  it("un usuario sin sets no recibe aviso", () => {
    expect(avisoPiezasIncompletas(AGREGADOS_VACIOS)).toBeNull();
  });
});
