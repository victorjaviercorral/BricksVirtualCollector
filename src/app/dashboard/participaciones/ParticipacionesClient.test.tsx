import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ParticipacionesClient from "./ParticipacionesClient";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type Props = ComponentProps<typeof ParticipacionesClient>;

/**
 * Reescrito para H5 (docs/05-plan/plan-intervencion-post-iteracion-3.md). "Mis Participaciones"
 * deja de ser un histórico y pasa a ser un panel de ACTIVIDAD EN CURSO:
 *  - solo exposiciones activas, con el puesto en vivo (posiciones) y el tiempo restante,
 *  - una sección "Dónde puedes participar" con exposiciones/bounties abiertos que el usuario aún
 *    no ha tocado (antes exposActivas/bountiesActivos se consultaban y se descartaban),
 *  - el histórico de exposiciones finalizadas y el resultado real (sets_insignias) se movieron a
 *    /dashboard/insignias -> Pasaporte, fuente única de verdad. Los tests de la antigua sección
 *    "Exposiciones Finalizadas" se retiran de aquí: no era un test roto, el comportamiento se
 *    reubicó (ver docs/testing e informe de cobertura). El equivalente vive en
 *    ExhibitionPassport.test.tsx / InsigniasClient.test.tsx.
 */
describe("ParticipacionesClient", () => {
  const mockRefresh = vi.fn();
  let mockSupabaseFrom: ReturnType<typeof vi.fn>;

  const expoActiva: Props["misExposiciones"][number] = {
    id: "exp1",
    estado: "aprobado",
    exposicion_id: "expo-verano",
    set_id: "set1",
    exposiciones_temporales: {
      titulo: "Expo Verano",
      estado: "activa",
      imagen_url: "/expo.jpg",
      es_continua: false,
      fecha_fin: new Date(Date.now() + 5.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    sets: { id: "set1", nombre: "Halcón Milenario" },
  };

  const baseProps: Props = {
    userProfile: {},
    misExposiciones: [],
    posiciones: {},
    misBounties: [],
    exposRecomendadas: [],
    bountiesRecomendados: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>);
    mockSupabaseFrom = vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    });
    vi.mocked(createClient).mockReturnValue({ from: mockSupabaseFrom } as unknown as ReturnType<typeof createClient>);
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("muestra la foto de perfil real cuando existe, nunca un avatar de ejemplo", () => {
    render(<ParticipacionesClient {...baseProps} userProfile={{ avatar_url: "https://x/mi-foto.jpg" }} />);
    expect(screen.getByAltText("Foto de perfil")).toHaveAttribute("src", "https://x/mi-foto.jpg");
  });

  it("cae a un icono de reserva si no hay avatar", () => {
    render(<ParticipacionesClient {...baseProps} userProfile={{}} />);
    expect(screen.queryByAltText("Foto de perfil")).not.toBeInTheDocument();
  });

  it("enlaza al Pasaporte de Exposiciones (el histórico ya no vive aquí)", () => {
    render(<ParticipacionesClient {...baseProps} />);
    expect(screen.getByRole("link", { name: /Pasaporte de Exposiciones/i })).toHaveAttribute(
      "href",
      "/dashboard/insignias"
    );
  });

  it("estado vacío total: sin actividad y sin recomendaciones", () => {
    render(<ParticipacionesClient {...baseProps} />);
    expect(screen.getByText("¡Aún no has participado!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorar Exposiciones/i })).toHaveAttribute("href", "/exposiciones");
  });

  it("renderiza una exposición activa con estado, puesto en vivo, tiempo restante y enlaces", () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        misExposiciones={[expoActiva]}
        posiciones={{ exp1: { posicion: 2, bricks: 7, total: 5 } }}
      />
    );

    expect(screen.getByText("Tus exposiciones activas")).toBeInTheDocument();
    expect(screen.getByText("En el ranking")).toBeInTheDocument();
    expect(screen.getByText(/#2 de 5 · 7 bricks/)).toBeInTheDocument();
    expect(screen.getByText(/Quedan \d+ días/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Expo Verano" })).toHaveAttribute("href", "/exposicion/expo-verano");
  });

  it("muestra 'No aprobado' y 'Exposición continua' según el caso", () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        misExposiciones={[
          {
            ...expoActiva,
            estado: "rechazado",
            exposiciones_temporales: { ...expoActiva.exposiciones_temporales, es_continua: true, fecha_fin: null },
          },
        ]}
        posiciones={{ exp1: null }}
      />
    );
    expect(screen.getByText("No aprobado")).toBeInTheDocument();
    expect(screen.getByText("Exposición continua")).toBeInTheDocument();
  });

  it("muestra 'Cierre inminente' cuando la fecha de fin ya pasó y horas cuando queda menos de un día", () => {
    const { rerender } = render(
      <ParticipacionesClient
        {...baseProps}
        misExposiciones={[
          {
            ...expoActiva,
            exposiciones_temporales: { ...expoActiva.exposiciones_temporales, es_continua: false, fecha_fin: new Date(Date.now() - 1000).toISOString() },
          },
        ]}
      />
    );
    expect(screen.getByText("Cierre inminente")).toBeInTheDocument();

    rerender(
      <ParticipacionesClient
        {...baseProps}
        misExposiciones={[
          {
            ...expoActiva,
            exposiciones_temporales: { ...expoActiva.exposiciones_temporales, es_continua: false, fecha_fin: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() },
          },
        ]}
      />
    );
    expect(screen.getByText(/Quedan \d+ h/)).toBeInTheDocument();
  });

  it("renderiza recomendaciones aunque no haya ninguna actividad propia", () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        exposRecomendadas={[{ id: "e1", titulo: "Abierta", descripcion: null }]}
        bountiesRecomendados={[{ id: "b1", nombre_set: "Solo nombre", descripcion: null, recompensa: null }]}
      />
    );
    expect(screen.queryByText("¡Aún no has participado!")).not.toBeInTheDocument();
    expect(screen.getByText("Dónde puedes participar")).toBeInTheDocument();
    expect(screen.getByText("Solo nombre")).toBeInTheDocument();
  });

  it("no muestra el badge de puesto si la participación aún no está aprobada", () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        misExposiciones={[{ ...expoActiva, estado: "pendiente" }]}
        posiciones={{ exp1: null }}
      />
    );
    expect(screen.getByText("En revisión")).toBeInTheDocument();
    expect(screen.queryByText(/bricks/)).not.toBeInTheDocument();
  });

  it("sección 'Dónde puedes participar' con exposiciones y bounties abiertos", () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        exposRecomendadas={[{ id: "e9", titulo: "Nueva Expo", descripcion: "únete" }]}
        bountiesRecomendados={[{ id: "b9", titulo: "Busca este set", descripcion: "raro", recompensa: 500 }]}
      />
    );
    expect(screen.getByText("Dónde puedes participar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nueva Expo/i })).toHaveAttribute("href", "/exposicion/e9");
    expect(screen.getByText("Busca este set")).toBeInTheDocument();
    expect(screen.getByText(/500 Pts/)).toBeInTheDocument();
  });

  it("los bounties reclamados enlazan a su detalle", () => {
    render(
      <ParticipacionesClient
        {...baseProps}
        misBounties={[{ id: "b1", nombre_set: "Set Raro", descripcion: "Encuéntralo", recompensa: 300 }]}
      />
    );
    expect(screen.getByText("Set Raro").closest("a")).toHaveAttribute("href", "/dashboard/participaciones/b1");
  });

  it("retirar un set: confirma, borra, notifica y refresca", async () => {
    render(<ParticipacionesClient {...baseProps} misExposiciones={[expoActiva]} />);
    fireEvent.click(screen.getByText("Retirar Set"));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(mockSupabaseFrom).toHaveBeenCalledWith("exposicion_sets"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Participación retirada con éxito"));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("no borra nada si el usuario cancela", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<ParticipacionesClient {...baseProps} misExposiciones={[expoActiva]} />);
    fireEvent.click(screen.getByText("Retirar Set"));
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
  });

  it("toast de error si el borrado falla", async () => {
    mockSupabaseFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "db" } }) }),
    });
    render(<ParticipacionesClient {...baseProps} misExposiciones={[expoActiva]} />);
    fireEvent.click(screen.getByText("Retirar Set"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al retirar la participación"));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
