import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ParticipacionesPage from "./page";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("redirect");
  }),
}));

interface MockClientProps {
  userProfile?: { avatar_url?: string | null } | null;
  misExposiciones: { exposiciones_temporales?: { titulo?: string } | null }[];
  posiciones: Record<string, unknown>;
  exposRecomendadas: { id: string }[];
  bountiesRecomendados: { id: string }[];
}

vi.mock("./ParticipacionesClient", () => ({
  default: (props: MockClientProps) => (
    <div data-testid="participaciones-client">
      <span data-testid="avatar-url">{props.userProfile?.avatar_url ?? "sin-avatar"}</span>
      <span data-testid="expos">{props.misExposiciones.map((e) => e.exposiciones_temporales?.titulo).join(",")}</span>
      <span data-testid="pos">{JSON.stringify(props.posiciones)}</span>
      <span data-testid="expo-reco">{props.exposRecomendadas.map((e) => e.id).join(",")}</span>
      <span data-testid="bounty-reco">{props.bountiesRecomendados.map((b) => b.id).join(",")}</span>
    </div>
  ),
}));

/**
 * Builder de mock por tabla. Cada rama devuelve la forma de cadena exacta que usa page.tsx.
 */
function mockSupabase(o: {
  user?: { id: string } | null;
  perfil?: unknown;
  userSets?: { id: string }[];
  validExpos?: unknown[];
  aprobadosActivos?: { exposicion_id: string; set_id: string }[];
  bricksActivos?: { exposicion_id: string; set_id: string }[];
  misBounties?: { bounty_id: string }[];
  exposActivas?: { id: string }[];
  bountiesActivos?: { id: string }[];
}) {
  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "usuarios_perfil") {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: o.perfil ?? null }) }) }) };
    }
    if (table === "sets") {
      return { select: () => ({ eq: () => Promise.resolve({ data: o.userSets ?? [] }) }) };
    }
    if (table === "exposicion_sets") {
      return {
        select: (cols: string) => {
          if (cols.includes("exposiciones_temporales")) {
            // validExposiciones: .select(join).in()
            return { in: () => Promise.resolve({ data: o.validExpos ?? [] }) };
          }
          // posiciones: .select('exposicion_id, set_id, creado_en').eq().in().order()
          return {
            eq: () => ({ in: () => ({ order: () => Promise.resolve({ data: o.aprobadosActivos ?? [] }) }) }),
          };
        },
      };
    }
    if (table === "bricks_recibidos") {
      return { select: () => ({ in: () => Promise.resolve({ data: o.bricksActivos ?? [] }) }) };
    }
    if (table === "bounties_reclamados") {
      return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: o.misBounties ?? [] }) }) }) };
    }
    if (table === "exposiciones_temporales") {
      return { select: () => ({ eq: () => Promise.resolve({ data: o.exposActivas ?? [] }) }) };
    }
    if (table === "bounties") {
      return { select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: o.bountiesActivos ?? [] }) }) }) };
    }
    throw new Error(`tabla no mockeada: ${table}`);
  });

  const user = "user" in o ? o.user : { id: "u1" };
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("ParticipacionesPage (SSR)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirige a login si no hay usuario", async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase({ user: null }));
    await expect(ParticipacionesPage()).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("pasa el perfil real y solo las exposiciones activas al cliente", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        perfil: { avatar_url: "https://x/foto.jpg" },
        userSets: [{ id: "set1" }],
        validExpos: [
          {
            id: "p1",
            estado: "aprobado",
            creado_en: "2026-08-01",
            exposicion_id: "e-activa",
            set_id: "set1",
            exposiciones_temporales: { id: "e-activa", titulo: "En Curso", estado: "activa", imagen_url: null, fecha_fin: null, es_continua: true },
            sets: { id: "set1", nombre: "Mi Set" },
          },
          {
            id: "p2",
            estado: "aprobado",
            creado_en: "2026-07-01",
            exposicion_id: "e-cerrada",
            set_id: "set1",
            exposiciones_temporales: { id: "e-cerrada", titulo: "Cerrada", estado: "archivada", imagen_url: null, fecha_fin: null, es_continua: true },
            sets: { id: "set1", nombre: "Mi Set" },
          },
        ],
        aprobadosActivos: [
          { exposicion_id: "e-activa", set_id: "set1" },
          { exposicion_id: "e-activa", set_id: "set2" },
        ],
        bricksActivos: [{ exposicion_id: "e-activa", set_id: "set2" }],
      })
    );

    render(await ParticipacionesPage());

    expect(screen.getByTestId("avatar-url")).toHaveTextContent("https://x/foto.jpg");
    // "Cerrada" (archivada) no debe llegar a este panel.
    expect(screen.getByTestId("expos")).toHaveTextContent("En Curso");
    expect(screen.getByTestId("expos")).not.toHaveTextContent("Cerrada");
    // set1 tiene 0 bricks, set2 tiene 1 -> set1 va 2º de 2.
    expect(screen.getByTestId("pos")).toHaveTextContent('"p1":{"posicion":2,"bricks":0,"total":2}');
  });

  it("recomienda exposiciones y bounties donde el usuario no participa ni ha reclamado", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        userSets: [{ id: "set1" }],
        validExpos: [
          {
            id: "p1",
            estado: "aprobado",
            creado_en: "2026-08-01",
            exposicion_id: "e-ya",
            set_id: "set1",
            exposiciones_temporales: { id: "e-ya", titulo: "Ya dentro", estado: "activa" },
            sets: { id: "set1", nombre: "Mi Set" },
          },
        ],
        aprobadosActivos: [{ exposicion_id: "e-ya", set_id: "set1" }],
        misBounties: [{ bounty_id: "b-ya" }],
        exposActivas: [{ id: "e-ya" }, { id: "e-nueva" }],
        bountiesActivos: [{ id: "b-ya" }, { id: "b-nuevo" }],
      })
    );

    render(await ParticipacionesPage());

    expect(screen.getByTestId("expo-reco")).toHaveTextContent("e-nueva");
    expect(screen.getByTestId("expo-reco")).not.toHaveTextContent("e-ya");
    expect(screen.getByTestId("bounty-reco")).toHaveTextContent("b-nuevo");
    expect(screen.getByTestId("bounty-reco")).not.toHaveTextContent("b-ya");
  });

  it("tolera arrays nulos (usuario sin sets)", async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase({ userSets: [], validExpos: [] }));
    render(await ParticipacionesPage());
    expect(screen.getByTestId("expos")).toHaveTextContent("");
  });

  it("sin participaciones aprobadas en exposiciones activas, no calcula posiciones", async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase({
        userSets: [{ id: "set1" }],
        validExpos: [
          {
            id: "p1",
            estado: "pendiente",
            creado_en: "2026-08-01",
            exposicion_id: "e-activa",
            set_id: "set1",
            exposiciones_temporales: { id: "e-activa", titulo: "En Curso", estado: "activa" },
            sets: { id: "set1", nombre: "Mi Set" },
          },
        ],
      })
    );
    render(await ParticipacionesPage());
    expect(screen.getByTestId("pos")).toHaveTextContent("{}");
    expect(screen.getByTestId("expos")).toHaveTextContent("En Curso");
  });
});
