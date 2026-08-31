import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TourLauncher } from "./TourLauncher";
import { TourProvider } from "./TourProvider";
import { TOUR_STORAGE_KEY } from "./steps";

const mockPathname = "/dashboard/vitrinas"; // fuera del Hub: sin auto-inicio
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockPathname,
}));

vi.mock("./TourOverlay", () => ({
  TourOverlay: () => <div data-testid="tour-overlay" />,
}));

beforeEach(() => {
  window.localStorage.clear();
});

function renderWithProvider(ui: React.ReactNode) {
  return render(<TourProvider isAuthed>{ui}</TourProvider>);
}

describe("TourLauncher", () => {
  it("variante 'button' lanza el tour al pulsar", () => {
    renderWithProvider(<TourLauncher />);
    expect(screen.queryByTestId("tour-overlay")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ver tour/i }));
    expect(screen.getByTestId("tour-overlay")).toBeInTheDocument();
  });

  it("variante 'menu-item' lanza el tour y ejecuta onLaunch (p. ej. cerrar menú)", () => {
    const onLaunch = vi.fn();
    renderWithProvider(<TourLauncher variant="menu-item" onLaunch={onLaunch} />);

    fireEvent.click(screen.getByRole("button", { name: /ver tour/i }));

    expect(onLaunch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("tour-overlay")).toBeInTheDocument();
  });

  it("lanza el tour aunque ya se haya visto antes", () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    renderWithProvider(<TourLauncher />);

    fireEvent.click(screen.getByRole("button", { name: /ver tour/i }));
    expect(screen.getByTestId("tour-overlay")).toBeInTheDocument();
  });
});
