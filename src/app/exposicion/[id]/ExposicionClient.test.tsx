import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ExposicionClient from "./ExposicionClient";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: { children?: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

const expoActiva = {
  id: "expo-1",
  titulo: "Semana Star Wars",
  descripcion: "Recrea la batalla",
  requisitos: "Solo naves",
  imagen_url: "http://img/expo.jpg",
  estado: "activa",
  es_continua: false,
  fecha_fin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
};

const expoArchivada = { ...expoActiva, estado: "archivada", fecha_fin: new Date(Date.now() - 1000).toISOString() };

const filaLive = (id: string, votos: number) => ({
  id,
  nombre: `Set ${id}`,
  num_piezas: 100,
  usuarios_perfil: { username: `user_${id}` },
  foto_url: `http://img/${id}.jpg`,
  votos,
});

const filaOficial = (id: string, rango: number, titulo: string, votos: number) => ({
  ...filaLive(id, votos),
  rango,
  titulo_insignia: titulo,
});

describe("ExposicionClient", () => {
  const mockInsert = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    } as unknown as ReturnType<typeof createClient>);
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>);
  });

  const baseProps = {
    exposicion: expoActiva,
    ranking: [] as Record<string, unknown>[],
    userSets: [] as Record<string, unknown>[],
    userId: "u1",
  };

  // --- Cabecera / hero / timer ---

  it("renderiza título, descripción y requisitos", () => {
    render(<ExposicionClient {...baseProps} />);
    expect(screen.getByText("Semana Star Wars")).toBeInTheDocument();
    expect(screen.getByText("Recrea la batalla")).toBeInTheDocument();
    expect(screen.getByText("Solo naves")).toBeInTheDocument();
  });

  it("exposición continua muestra 'Exposición Continua' en el contador", () => {
    render(<ExposicionClient {...baseProps} exposicion={{ ...expoActiva, es_continua: true, fecha_fin: null }} />);
    expect(screen.getByText("Exposición Continua")).toBeInTheDocument();
  });

  it("exposición con fecha_fin pasada muestra 'Finalizada'", () => {
    render(<ExposicionClient {...baseProps} exposicion={expoArchivada} modo="oficial" />);
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
  });

  it("una exposición archivada continua muestra 'Finalizada', no 'Tiempo Restante / Exposición Continua'", () => {
    render(<ExposicionClient {...baseProps} exposicion={{ ...expoArchivada, es_continua: true, fecha_fin: null }} modo="oficial" />);
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.queryByText("Exposición Continua")).not.toBeInTheDocument();
    expect(screen.queryByText("Tiempo Restante")).not.toBeInTheDocument();
    expect(screen.getByText("Estado del evento")).toBeInTheDocument();
  });

  it("exposición activa con fecha futura muestra la cuenta atrás", () => {
    render(<ExposicionClient {...baseProps} />);
    expect(screen.getByText(/\dd \d+h \d+m/)).toBeInTheDocument();
  });

  // --- Modo activo ---

  it("visitante sin sesión (userId null): sin PARTICIPAR ni voto, con invitación a iniciar sesión", () => {
    render(
      <ExposicionClient {...baseProps} userId={null} ranking={[filaLive("s1", 3)]} />
    );
    expect(screen.queryByRole("button", { name: "PARTICIPAR" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+1 Voto/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inicia sesión para participar/i })).toHaveAttribute("href", "/login");
  });

  it("modo live: botón PARTICIPAR visible y abre el modal", () => {
    render(<ExposicionClient {...baseProps} userSets={[{ id: "s1", nombre: "Mi Set", fotos: [{ url: "x" }] }]} />);
    fireEvent.click(screen.getByRole("button", { name: "PARTICIPAR" }));
    expect(screen.getByText("Unirse a la Exposición")).toBeInTheDocument();
    expect(screen.getByText("Mi Set")).toBeInTheDocument();
  });

  it("modo live: murió el ranking vacío invita a unirse", () => {
    render(<ExposicionClient {...baseProps} />);
    expect(screen.getByText("Aún no hay participantes aprobados.")).toBeInTheDocument();
  });

  it("modo live: cada fila muestra los votos y el botón +1 Voto en exposición activa", () => {
    render(<ExposicionClient {...baseProps} ranking={[filaLive("s1", 5)]} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+1 Voto/i })).toBeInTheDocument();
    expect(screen.getByText("@user_s1")).toBeInTheDocument();
  });

  it("votar con éxito notifica y refresca", async () => {
    render(<ExposicionClient {...baseProps} ranking={[filaLive("s1", 5)]} />);
    fireEvent.click(screen.getByRole("button", { name: /\+1 Voto/i }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("¡Voto registrado!"));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("votar dos veces el mismo set: error 23505 traducido", async () => {
    mockInsert.mockResolvedValue({ error: { code: "23505" } });
    render(<ExposicionClient {...baseProps} ranking={[filaLive("s1", 5)]} />);
    fireEvent.click(screen.getByRole("button", { name: /\+1 Voto/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Ya has votado por este set en esta exposición")
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("votar con error genérico", async () => {
    mockInsert.mockResolvedValue({ error: { code: "500" } });
    render(<ExposicionClient {...baseProps} ranking={[filaLive("s1", 5)]} />);
    fireEvent.click(screen.getByRole("button", { name: /\+1 Voto/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al votar"));
  });

  // --- Modal de participación ---

  it("participar: selecciona un set, envía y notifica éxito", async () => {
    render(
      <ExposicionClient {...baseProps} userSets={[{ id: "s1", nombre: "Mi Set", fotos: [{ url: "x" }] }]} />
    );
    fireEvent.click(screen.getByRole("button", { name: "PARTICIPAR" }));
    fireEvent.click(screen.getByText("Mi Set"));
    fireEvent.click(screen.getByRole("button", { name: /Enviar a Revisión/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Set enviado a revisión. ¡Mucha suerte!")
    );
  });

  it("participar: set ya participando -> error 23505 traducido", async () => {
    mockInsert.mockResolvedValue({ error: { code: "23505" } });
    render(
      <ExposicionClient {...baseProps} userSets={[{ id: "s1", nombre: "Mi Set", fotos: [{ url: "x" }] }]} />
    );
    fireEvent.click(screen.getByRole("button", { name: "PARTICIPAR" }));
    fireEvent.click(screen.getByText("Mi Set"));
    fireEvent.click(screen.getByRole("button", { name: /Enviar a Revisión/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Este set ya está participando o en revisión")
    );
  });

  it("participar: error genérico", async () => {
    mockInsert.mockResolvedValue({ error: { code: "500" } });
    render(
      <ExposicionClient {...baseProps} userSets={[{ id: "s1", nombre: "Mi Set", fotos: [{ url: "x" }] }]} />
    );
    fireEvent.click(screen.getByRole("button", { name: "PARTICIPAR" }));
    fireEvent.click(screen.getByText("Mi Set"));
    fireEvent.click(screen.getByRole("button", { name: /Enviar a Revisión/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al enviar la solicitud"));
  });

  it("participar sin sets muestra el mensaje correspondiente", () => {
    render(<ExposicionClient {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "PARTICIPAR" }));
    expect(screen.getByText("No tienes ningún set en tus vitrinas para participar.")).toBeInTheDocument();
  });

  // --- Modo oficial (archivada) ---

  it("modo oficial: cabecera 'Ranking Oficial', sin PARTICIPAR, con panel 'Evento Finalizado'", () => {
    render(
      <ExposicionClient
        {...baseProps}
        exposicion={expoArchivada}
        modo="oficial"
        ranking={[filaOficial("s1", 1, "🥇 1er Puesto", 12)]}
      />
    );
    expect(screen.getByText("Ranking Oficial")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PARTICIPAR" })).not.toBeInTheDocument();
    expect(screen.getByText("Evento Finalizado")).toBeInTheDocument();
  });

  it("modo oficial: cada fila muestra el título de insignia y los bricks congelados, sin botón de voto", () => {
    render(
      <ExposicionClient
        {...baseProps}
        exposicion={expoArchivada}
        modo="oficial"
        ranking={[filaOficial("s1", 1, "🥇 1er Puesto", 12), filaOficial("s2", 2, "🥈 2º Puesto", 4)]}
      />
    );
    expect(screen.getByText("🥇 1er Puesto")).toBeInTheDocument();
    expect(screen.getByText("🥈 2º Puesto")).toBeInTheDocument();
    expect(screen.getByText("12 bricks")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+1 Voto/i })).not.toBeInTheDocument();
  });

  it("modo oficial: exposición cerrada sin ranking previo a D3", () => {
    render(
      <ExposicionClient
        {...baseProps}
        exposicion={expoArchivada}
        modo="oficial"
        ranking={[]}
        motivoVacio="anterior-al-registro"
      />
    );
    expect(screen.getByText("Sin ranking oficial guardado")).toBeInTheDocument();
  });

  it("modo oficial: exposición cerrada sin participantes", () => {
    render(
      <ExposicionClient
        {...baseProps}
        exposicion={expoArchivada}
        modo="oficial"
        ranking={[]}
        motivoVacio="sin-participantes"
      />
    );
    expect(screen.getByText("Se cerró sin participantes")).toBeInTheDocument();
  });
});
