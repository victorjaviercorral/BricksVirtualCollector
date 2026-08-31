import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TourProvider } from "./TourProvider";
import { TOUR_STEPS } from "./steps";

let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn((p: string) => { mockPathname = p; }) }),
  usePathname: () => mockPathname,
}));

let reduceMotion = false;
const MOTION_PROPS = new Set(["initial", "animate", "exit", "transition", "variants", "whileHover", "whileTap", "layout"]);
type MockProps = { children?: React.ReactNode } & Record<string, unknown>;
// Componentes estables por clave: un componente nuevo en cada render remontaría el árbol y
// dejaría el test en un bucle de montaje.
const motionCache: Record<string, (props: MockProps) => React.ReactElement> = {};
vi.mock("framer-motion", () => ({
  useReducedMotion: () => reduceMotion,
  AnimatePresence: ({ children }: MockProps) => <>{children}</>,
  motion: new Proxy(
    {} as Record<string, unknown>,
    {
      get: (_target, key: string) => {
        if (!motionCache[key]) {
          motionCache[key] = ({ children, ...props }: MockProps) => {
            const clean: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(props)) {
              if (!MOTION_PROPS.has(k)) clean[k] = v;
            }
            return <div {...clean}>{children}</div>;
          };
        }
        return motionCache[key];
      },
    }
  ),
}));

// Objetivos reales del tour, para que el spotlight tenga a qué anclarse.
function Targets() {
  return (
    <>
      <div data-tour="hub-hero">hero</div>
      <div data-tour="mis-vitrinas">vitrinas</div>
      <div data-tour="hub-bento">bento</div>
    </>
  );
}

function renderOverlay() {
  return render(
    <TourProvider isAuthed>
      <Targets />
    </TourProvider>
  );
}

beforeEach(() => {
  vi.useRealTimers();
  mockPathname = "/dashboard";
  reduceMotion = false;
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.style.overflow = "";
});

describe("TourOverlay", () => {
  it("muestra el primer paso con su contador, título y cuerpo", async () => {
    renderOverlay();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(`Paso 1 / ${TOUR_STEPS.length}`)).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].body)).toBeInTheDocument();
  });

  it("avanza al siguiente paso al pulsar 'Siguiente'", async () => {
    renderOverlay();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    expect(await screen.findByText(TOUR_STEPS[1].title)).toBeInTheDocument();
    expect(screen.getByText(`Paso 2 / ${TOUR_STEPS.length}`)).toBeInTheDocument();
  });

  it("retrocede con 'Anterior' (visible solo a partir del paso 2)", async () => {
    renderOverlay();
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: /anterior/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    await screen.findByText(TOUR_STEPS[1].title);
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));

    expect(await screen.findByText(TOUR_STEPS[0].title)).toBeInTheDocument();
  });

  it("cierra con la tecla Escape", async () => {
    renderOverlay();
    await screen.findByRole("dialog");

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cierra al pulsar 'Saltar tour' y persiste la flag", async () => {
    renderOverlay();
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: "Saltar tour" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(window.localStorage.getItem("bvc_tour_v1")).toBe("1");
  });

  it("el último paso muestra 'Terminar' en lugar de 'Siguiente'", async () => {
    renderOverlay();
    await screen.findByRole("dialog");
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByRole("button", { name: /siguiente|terminar/i }));
      await screen.findByText(TOUR_STEPS[i + 1].title);
    }
    expect(screen.getByRole("button", { name: /terminar/i })).toBeInTheDocument();
  });

  it("expone un anuncio aria-live con el contenido del paso", async () => {
    const { container } = renderOverlay();
    await screen.findByRole("dialog");
    const live = container.ownerDocument.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain(TOUR_STEPS[0].title);
  });

  it("mide el objetivo (scrollIntoView) cuando el elemento existe", async () => {
    renderOverlay();
    await screen.findByRole("dialog");
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  it("con prefers-reduced-motion se renderiza igualmente (movimiento atenuado)", async () => {
    reduceMotion = true;
    renderOverlay();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument();
  });

  it("bloquea el scroll del body mientras está activo y lo restaura al cerrar", async () => {
    renderOverlay();
    await screen.findByRole("dialog");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Saltar tour" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("degrada a tooltip centrado si el objetivo no aparece a tiempo", async () => {
    vi.useFakeTimers();
    const view = render(
      <TourProvider isAuthed>
        {/* sin ningún data-tour: los objetivos nunca se encontrarán */}
        <div>vacío</div>
      </TourProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // El diálogo sigue mostrándose (centrado, sin spotlight) con el texto del paso.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(TOUR_STEPS[0].body)).toBeInTheDocument();

    view.unmount();
    vi.useRealTimers();
  });
});
