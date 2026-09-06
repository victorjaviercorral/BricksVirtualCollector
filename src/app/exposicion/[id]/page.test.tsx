import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ExposicionPage from "./page";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

interface MockClientProps {
  modo: string;
  ranking: { titulo_insignia?: string; nombre?: string }[];
  motivoVacio: string | null;
  userSets: unknown[];
}

vi.mock("./ExposicionClient", () => ({
  default: ({ modo, ranking, motivoVacio, userSets }: MockClientProps) => (
    <div data-testid="exposicion-client">
      <span data-testid="modo">{modo}</span>
      <span data-testid="ranking-len">{ranking.length}</span>
      <span data-testid="ranking-titulos">{ranking.map((r) => r.titulo_insignia || r.nombre).join(",")}</span>
      <span data-testid="motivo">{motivoVacio ?? "null"}</span>
      <span data-testid="user-sets">{userSets.length}</span>
    </div>
  ),
}));

const setAnidado = (id: string) => ({
  id,
  nombre: `Set ${id}`,
  num_piezas: 100,
  usuarios_perfil: { username: `u_${id}` },
  fotos: [{ url: `http://img/${id}.jpg` }],
});

interface Opts {
  exposicion?: Record<string, unknown> | null;
  bricks?: { set_id: string }[];
  insignias?: unknown[];
  aprobadosCount?: number;
  participaciones?: unknown[];
  user?: { id: string } | null;
  mySets?: unknown[];
}

function mockSupabase(o: Opts) {
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "exposiciones_temporales") {
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: o.exposicion ?? null }) }) }),
      };
    }
    if (table === "bricks_recibidos") {
      return { select: () => ({ eq: () => Promise.resolve({ data: o.bricks ?? [] }) }) };
    }
    if (table === "sets_insignias") {
      return { select: () => ({ eq: () => Promise.resolve({ data: o.insignias ?? [] }) }) };
    }
    if (table === "exposicion_sets") {
      // Rama activa: .select(...).eq().eq() -> participaciones
      // Rama archivada (count): .select('id',{count}).eq().eq() -> { count }
      return {
        select: (_cols: string, opts?: { count?: string; head?: boolean }) => ({
          eq: () => ({
            eq: () =>
              Promise.resolve(
                opts?.head
                  ? { count: o.aprobadosCount ?? 0 }
                  : { data: o.participaciones ?? [] }
              ),
          }),
        }),
      };
    }
    if (table === "sets") {
      return { select: () => ({ eq: () => Promise.resolve({ data: o.mySets ?? [] }) }) };
    }
    throw new Error(`tabla no mockeada: ${table}`);
  });

  return {
    from,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: o.user ?? null } }) },
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("ExposicionPage (SSR)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("notFound si la exposición no existe", async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase({ exposicion: null }));
    await expect(ExposicionPage({ params: Promise.resolve({ id: "x" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("exposición activa: modo live, ranking en vivo por bricks, trae los sets del usuario", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        exposicion: { id: "e1", estado: "activa", titulo: "Activa" },
        participaciones: [
          { id: "p1", estado: "aprobado", set_id: "s1", sets: setAnidado("s1") },
          { id: "p2", estado: "aprobado", set_id: "s2", sets: setAnidado("s2") },
        ],
        bricks: [{ set_id: "s2" }, { set_id: "s2" }, { set_id: "s1" }],
        user: { id: "u1" },
        mySets: [{ id: "s1", nombre: "Mi Set", fotos: [] }],
      })
    );

    const jsx = await ExposicionPage({ params: Promise.resolve({ id: "e1" }) });
    render(jsx);

    expect(screen.getByTestId("modo")).toHaveTextContent("live");
    expect(screen.getByTestId("ranking-len")).toHaveTextContent("2");
    // s2 tiene 2 bricks -> primero
    expect(screen.getByTestId("ranking-titulos")).toHaveTextContent("Set s2,Set s1");
    expect(screen.getByTestId("user-sets")).toHaveTextContent("1");
    expect(screen.getByTestId("motivo")).toHaveTextContent("null");
  });

  it("exposición archivada: modo oficial, ranking desde sets_insignias ordenado por rango, sin sets de usuario", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        exposicion: { id: "e1", estado: "archivada", titulo: "Cerrada" },
        insignias: [
          { set_id: "s2", rango: 2, titulo_insignia: "🥈 2º Puesto", sets: setAnidado("s2") },
          { set_id: "s1", rango: 1, titulo_insignia: "🥇 1er Puesto", sets: setAnidado("s1") },
        ],
        bricks: [{ set_id: "s1" }],
        aprobadosCount: 2,
        user: { id: "u1" },
        mySets: [{ id: "sx", nombre: "no deberia" }],
      })
    );

    const jsx = await ExposicionPage({ params: Promise.resolve({ id: "e1" }) });
    render(jsx);

    expect(screen.getByTestId("modo")).toHaveTextContent("oficial");
    expect(screen.getByTestId("ranking-titulos")).toHaveTextContent("🥇 1er Puesto,🥈 2º Puesto");
    // En modo oficial no se consultan los sets del usuario (no hay modal de participación).
    expect(screen.getByTestId("user-sets")).toHaveTextContent("0");
  });

  it("archivada sin insignias pero con aprobados -> motivo 'anterior-al-registro'", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        exposicion: { id: "e1", estado: "archivada" },
        insignias: [],
        aprobadosCount: 3,
      })
    );
    const jsx = await ExposicionPage({ params: Promise.resolve({ id: "e1" }) });
    render(jsx);
    expect(screen.getByTestId("motivo")).toHaveTextContent("anterior-al-registro");
  });

  it("archivada sin insignias y sin aprobados -> motivo 'sin-participantes'", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({ exposicion: { id: "e1", estado: "archivada" }, insignias: [], aprobadosCount: 0 })
    );
    const jsx = await ExposicionPage({ params: Promise.resolve({ id: "e1" }) });
    render(jsx);
    expect(screen.getByTestId("motivo")).toHaveTextContent("sin-participantes");
  });
});
