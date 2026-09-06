import { describe, it, expect } from "vitest";
import {
  FOTO_SET_RESERVA,
  contarBricksPorSet,
  rankingEnVivo,
  rankingOficial,
  motivoHistoricoVacio,
  resumenExposiciones,
  rangoFechasExposicion,
  posicionEnRankingVivo,
} from "./exposiciones";

const set = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  nombre: `Set ${id}`,
  num_piezas: 100,
  usuarios_perfil: { username: `user_${id}` },
  fotos: [{ url: `https://cdn/${id}.jpg` }],
  ...extra,
});

describe("contarBricksPorSet", () => {
  it("agrupa por set_id", () => {
    expect(contarBricksPorSet([{ set_id: "a" }, { set_id: "a" }, { set_id: "b" }])).toEqual({ a: 2, b: 1 });
  });

  it("null/undefined -> objeto vacío", () => {
    expect(contarBricksPorSet(null)).toEqual({});
    expect(contarBricksPorSet(undefined)).toEqual({});
  });
});

describe("rankingEnVivo", () => {
  it("ordena por bricks recibidos descendente", () => {
    const participaciones = [
      { set_id: "s1", sets: set("s1") },
      { set_id: "s2", sets: set("s2") },
      { set_id: "s3", sets: set("s3") },
    ];
    const bricks = [{ set_id: "s2" }, { set_id: "s2" }, { set_id: "s3" }];

    const r = rankingEnVivo(participaciones, bricks);

    expect(r.map((f) => f.id)).toEqual(["s2", "s3", "s1"]);
    expect(r.map((f) => f.votos)).toEqual([2, 1, 0]);
  });

  it("en empate conserva el orden de entrada (estable)", () => {
    const participaciones = [
      { set_id: "primero", sets: set("primero") },
      { set_id: "segundo", sets: set("segundo") },
    ];
    const r = rankingEnVivo(participaciones, []);
    expect(r.map((f) => f.id)).toEqual(["primero", "segundo"]);
  });

  it("normaliza la relación sets aunque el cliente la infiera como array", () => {
    const r = rankingEnVivo([{ set_id: "s1", sets: [set("s1")] }], []);
    expect(r[0].id).toBe("s1");
    expect(r[0].usuarios_perfil?.username).toBe("user_s1");
  });

  it("usa la foto de reserva cuando el set no tiene fotos", () => {
    const r = rankingEnVivo([{ set_id: "s1", sets: set("s1", { fotos: [] }) }], []);
    expect(r[0].foto_url).toBe(FOTO_SET_RESERVA);
  });

  it("descarta participaciones sin set resoluble", () => {
    const r = rankingEnVivo(
      [
        { set_id: "s1", sets: null },
        { set_id: "s2", sets: set("s2") },
      ],
      []
    );
    expect(r.map((f) => f.id)).toEqual(["s2"]);
  });

  it("entrada nula devuelve lista vacía", () => {
    expect(rankingEnVivo(null, null)).toEqual([]);
  });
});

describe("rankingOficial", () => {
  const insignias = [
    { set_id: "s2", rango: 2, titulo_insignia: "🥈 2º Puesto", sets: set("s2") },
    { set_id: "s1", rango: 1, titulo_insignia: "🥇 1er Puesto", sets: set("s1") },
    { set_id: "s3", rango: 3, titulo_insignia: "🥉 3er Puesto", sets: set("s3") },
  ];

  it("ordena por rango ascendente, no por bricks", () => {
    const r = rankingOficial(insignias, { s1: 1, s2: 50, s3: 10 });
    expect(r.map((f) => f.id)).toEqual(["s1", "s2", "s3"]);
    expect(r.map((f) => f.titulo_insignia)).toEqual(["🥇 1er Puesto", "🥈 2º Puesto", "🥉 3er Puesto"]);
  });

  it("adjunta el recuento de bricks congelado como dato, sin reordenar", () => {
    const r = rankingOficial(insignias, { s2: 7 });
    expect(r.find((f) => f.id === "s2")?.votos).toBe(7);
    expect(r.find((f) => f.id === "s1")?.votos).toBe(0);
  });

  it("rango null va al final", () => {
    const r = rankingOficial(
      [
        { set_id: "sx", rango: null, titulo_insignia: "Participante", sets: set("sx") },
        { set_id: "s1", rango: 1, titulo_insignia: "🥇 1er Puesto", sets: set("s1") },
      ],
      {}
    );
    expect(r.map((f) => f.id)).toEqual(["s1", "sx"]);
  });

  it("entrada nula devuelve lista vacía", () => {
    expect(rankingOficial(null, {})).toEqual([]);
  });
});

describe("motivoHistoricoVacio", () => {
  it("hay insignias -> null (sí hay ranking)", () => {
    expect(motivoHistoricoVacio(3, 3)).toBeNull();
  });

  it("sin insignias pero con aprobados -> anterior al registro (D3)", () => {
    expect(motivoHistoricoVacio(0, 2)).toBe("anterior-al-registro");
  });

  it("sin insignias y sin aprobados -> se cerró sin participantes", () => {
    expect(motivoHistoricoVacio(0, 0)).toBe("sin-participantes");
  });
});

describe("resumenExposiciones", () => {
  it("cuenta participantes aprobados y bricks por exposición", () => {
    const mapa = resumenExposiciones(
      [{ id: "e1" }, { id: "e2" }],
      [{ exposicion_id: "e1" }, { exposicion_id: "e1" }, { exposicion_id: "e2" }],
      [{ exposicion_id: "e1" }, { exposicion_id: "e1" }, { exposicion_id: "e1" }]
    );
    expect(mapa.get("e1")).toEqual({ participantes: 2, bricks: 3 });
    expect(mapa.get("e2")).toEqual({ participantes: 1, bricks: 0 });
  });

  it("una exposición sin actividad aparece con ceros, no ausente", () => {
    const mapa = resumenExposiciones([{ id: "e1" }], [], []);
    expect(mapa.get("e1")).toEqual({ participantes: 0, bricks: 0 });
  });

  it("tolera filas de exposiciones no listadas y entradas nulas", () => {
    const mapa = resumenExposiciones(null, [{ exposicion_id: "huerfana" }], null);
    expect(mapa.get("huerfana")).toEqual({ participantes: 1, bricks: 0 });
  });
});

describe("posicionEnRankingVivo", () => {
  it("calcula puesto, bricks y total para mi set", () => {
    const r = posicionEnRankingVivo("s2", ["s1", "s2", "s3"], { s1: 1, s2: 9, s3: 4 });
    expect(r).toEqual({ posicion: 1, bricks: 9, total: 3 });
  });

  it("en empate, el orden de aprobación decide el puesto", () => {
    const r = posicionEnRankingVivo("s3", ["s1", "s2", "s3"], { s1: 5, s2: 5, s3: 5 });
    expect(r?.posicion).toBe(3);
  });

  it("mi set aún no está aprobado -> null", () => {
    expect(posicionEnRankingVivo("sX", ["s1", "s2"], {})).toBeNull();
  });

  it("sin bricks todavía, mantengo mi orden de entrada", () => {
    const r = posicionEnRankingVivo("s1", ["s1", "s2"], {});
    expect(r).toEqual({ posicion: 1, bricks: 0, total: 2 });
  });
});

describe("rangoFechasExposicion", () => {
  it("exposición continua", () => {
    expect(rangoFechasExposicion({ es_continua: true })).toBe("Exposición continua");
  });

  it("fechas null -> texto legible, nunca 1/1/1970", () => {
    expect(rangoFechasExposicion({ es_continua: false, fecha_inicio: null, fecha_fin: null })).toBe(
      "Fechas por definir"
    );
    expect(rangoFechasExposicion({ fecha_inicio: "2026-08-08T00:00:00Z", fecha_fin: null })).toBe(
      "Fechas por definir"
    );
  });

  it("rango con ambas fechas", () => {
    const texto = rangoFechasExposicion({
      fecha_inicio: "2026-08-08T00:00:00Z",
      fecha_fin: "2026-08-10T00:00:00Z",
    });
    expect(texto).toMatch(/2026/);
    expect(texto).toContain("–");
  });
});
