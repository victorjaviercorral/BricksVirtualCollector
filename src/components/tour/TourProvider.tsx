"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOUR_STEPS, TOUR_STORAGE_KEY, type TourStep } from "./steps";
import { TourOverlay } from "./TourOverlay";

interface TourContextValue {
  isActive: boolean;
  stepIndex: number;
  steps: TourStep[];
  hasSeenTour: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  close: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour debe usarse dentro de <TourProvider>");
  }
  return ctx;
}

function readSeenFlag(): boolean {
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    // localStorage puede estar deshabilitado (modo privado estricto, políticas de empresa).
    return false;
  }
}

function writeSeenFlag(): void {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    /* sin persistencia: el tour volverá a aparecer, no es crítico */
  }
}

export function TourProvider({
  children,
  isAuthed,
}: {
  children: React.ReactNode;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // En SSR no hay localStorage: se asume "visto" (no molesta) y el cliente decide el auto-inicio.
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(() =>
    typeof window === "undefined" ? true : readSeenFlag()
  );
  const autoStartChecked = useRef(false);

  const close = useCallback(() => {
    setIsActive(false);
    setStepIndex(0);
    setHasSeenTour(true);
    writeSeenFlag();
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setIsActive(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= TOUR_STEPS.length - 1) {
        close();
        return 0;
      }
      return i + 1;
    });
  }, [close]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // Auto-inicio: solo una vez por carga, si el usuario está autenticado, no ha visto el tour y
  // aterriza en el Hub. Fuera del Hub no se autoinicia (se lanza con el botón "Ver Tour").
  // El arranque se difiere un tick para no encadenar renders desde el cuerpo del efecto.
  useEffect(() => {
    if (autoStartChecked.current) return;
    if (!isAuthed) return;
    if (pathname !== "/dashboard") return;
    autoStartChecked.current = true;
    if (readSeenFlag()) return;
    const id = window.setTimeout(() => setIsActive(true), 0);
    return () => window.clearTimeout(id);
  }, [isAuthed, pathname]);

  // Navegación entre rutas: si el paso actual vive en otra ruta, llevamos al usuario allí.
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[stepIndex];
    if (step && step.route !== pathname) {
      router.push(step.route);
    }
  }, [isActive, stepIndex, pathname, router]);

  const value = useMemo<TourContextValue>(
    () => ({
      isActive,
      stepIndex,
      steps: TOUR_STEPS,
      hasSeenTour,
      start,
      next,
      prev,
      close,
    }),
    [isActive, stepIndex, hasSeenTour, start, next, prev, close]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive && <TourOverlay />}
    </TourContext.Provider>
  );
}
