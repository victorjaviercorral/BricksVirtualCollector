"use client";

import { Compass } from "lucide-react";
import { useTour } from "./TourProvider";

/**
 * Botón para (re)lanzar el tour de onboarding bajo demanda.
 *
 * `variant="button"` — pieza neo-brutal para cabeceras (Hub).
 * `variant="menu-item"` — fila para el desplegable de perfil de la Navbar.
 */
export function TourLauncher({
  variant = "button",
  onLaunch,
}: {
  variant?: "button" | "menu-item";
  onLaunch?: () => void;
}) {
  const { start } = useTour();

  const handleClick = () => {
    onLaunch?.();
    start();
  };

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        <Compass size={16} />
        Ver Tour
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-panel px-4 py-2 text-sm font-bold shadow-[2px_3px_0px_0px_#0F172A] transition-transform hover:-translate-y-0.5 active:translate-y-0 dark:shadow-[2px_3px_0px_0px_#F8F9FA]"
    >
      <Compass size={16} />
      Ver Tour
    </button>
  );
}
