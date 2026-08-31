import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TourProvider, useTour } from "./TourProvider";
import { TOUR_STEPS, TOUR_STORAGE_KEY } from "./steps";

// Router / pathname controlables por test (el mock global de vitest.setup.ts fija pathname="/").
let mockPathname = "/dashboard";
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

// El overlay real depende de framer-motion + portal; aquí solo interesa la lógica del provider.
vi.mock("./TourOverlay", () => ({
  TourOverlay: () => <div data-testid="tour-overlay" />,
}));

function Consumer() {
  const { isActive, stepIndex, start, next, prev, close, hasSeenTour } = useTour();
  return (
    <div>
      <span data-testid="active">{String(isActive)}</span>
      <span data-testid="index">{stepIndex}</span>
      <span data-testid="seen">{String(hasSeenTour)}</span>
      <button onClick={start}>start</button>
      <button onClick={next}>next</button>
      <button onClick={prev}>prev</button>
      <button onClick={close}>close</button>
    </div>
  );
}

function setup(isAuthed = true) {
  return render(
    <TourProvider isAuthed={isAuthed}>
      <Consumer />
    </TourProvider>
  );
}

beforeEach(() => {
  mockPathname = "/dashboard";
  mockPush.mockClear();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("TourProvider — auto-inicio", () => {
  it("se auto-inicia en /dashboard si no hay flag y el usuario está autenticado", async () => {
    setup(true);
    expect(await screen.findByTestId("tour-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("active")).toHaveTextContent("true");
  });

  it("NO se auto-inicia si ya existe la flag de 'visto'", () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setup(true);
    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();
    expect(screen.getByTestId("seen")).toHaveTextContent("true");
  });

  it("NO se auto-inicia fuera de /dashboard", () => {
    mockPathname = "/dashboard/vitrinas";
    setup(true);
    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();
  });

  it("NO se auto-inicia si el usuario no está autenticado", () => {
    setup(false);
    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();
  });

  it("no rompe si localStorage lanza al leer", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(() => setup(true)).not.toThrow();
  });
});

describe("TourProvider — control manual y navegación", () => {
  it("start() abre el tour aunque exista la flag de 'visto'", async () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setup(true);
    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();

    await act(async () => {
      screen.getByText("start").click();
    });
    expect(screen.getByTestId("tour-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("next() avanza y prev() retrocede sin salirse de los límites", async () => {
    setup(true);
    await screen.findByTestId("tour-overlay");

    await act(async () => screen.getByText("prev").click());
    expect(screen.getByTestId("index")).toHaveTextContent("0");

    await act(async () => screen.getByText("next").click());
    expect(screen.getByTestId("index")).toHaveTextContent("1");

    await act(async () => screen.getByText("prev").click());
    expect(screen.getByTestId("index")).toHaveTextContent("0");
  });

  it("close() cierra el tour y persiste la flag en localStorage", async () => {
    setup(true);
    await screen.findByTestId("tour-overlay");

    await act(async () => screen.getByText("close").click());

    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_STORAGE_KEY)).toBe("1");
  });

  it("terminar el último paso cierra el tour y persiste la flag", async () => {
    setup(true);
    await screen.findByTestId("tour-overlay");

    for (let i = 0; i < TOUR_STEPS.length; i++) {
      await act(async () => screen.getByText("next").click());
    }

    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_STORAGE_KEY)).toBe("1");
  });

  it("navega a la ruta del paso cuando difiere de la actual", async () => {
    // Paso 3 (index 2) vive en /dashboard/vitrinas.
    setup(true);
    await screen.findByTestId("tour-overlay");

    await act(async () => screen.getByText("next").click()); // -> index 1 (/dashboard)
    await act(async () => screen.getByText("next").click()); // -> index 2 (/dashboard/vitrinas)

    expect(mockPush).toHaveBeenCalledWith("/dashboard/vitrinas");
  });

  it("useTour lanza si se usa fuera del provider", () => {
    const Bare = () => {
      useTour();
      return null;
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(/dentro de <TourProvider>/);
    spy.mockRestore();
  });
});
