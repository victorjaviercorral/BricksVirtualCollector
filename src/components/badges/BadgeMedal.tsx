"use client";

import {
  Award,
  Blocks,
  Boxes,
  Camera,
  Coins,
  Crown,
  Flame,
  HandHeart,
  Heart,
  Hourglass,
  Landmark,
  Medal,
  Palette,
  Pickaxe,
  Plane,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { fraccionProgreso, type EjeInsignia, type InsigniaEvaluada } from "@/lib/insignias-usuario";

/**
 * La medalla. Identidad visual en tres capas, para que una insignia se reconozca de un vistazo:
 *
 *   1. ICONO  = familia. Fijo, nunca cambia entre tramos.
 *   2. COLOR  = eje de juego (lo que tengo / doy y recibo / muestro / compito / rareza / podio).
 *               Con 11 familias y 6 tokens de marca, el color agrupa y el icono identifica.
 *   3. ARO    = nivel (I bronce -> V diamante), más un chip de texto con el número romano.
 *
 * Bloqueada: mismo icono al 30%, borde discontinuo y SIEMPRE la barra `valor / objetivo`. Nunca
 * un cuadrado gris vacío -- eso es literalmente lo que retiró la decisión D3 ("2/24
 * Desbloqueadas" sobre logros inventados).
 *
 * Accesibilidad: el icono va `aria-hidden` y la medalla lleva `aria-label` con nombre, estado y
 * progreso. Nada se codifica solo por color: el tramo también es texto.
 */

/** Mapa nombre-de-icono -> componente. El catálogo guarda el nombre como string para que
 *  `src/lib/insignias-usuario.ts` siga siendo puro (sin JSX ni dependencias de React). */
export const ICONOS: Record<string, LucideIcon> = {
  Award,
  Blocks,
  Boxes,
  Camera,
  Coins,
  Crown,
  Flame,
  HandHeart,
  Heart,
  Hourglass,
  Landmark,
  Medal,
  Palette,
  Pickaxe,
  Plane,
  Target,
  Trophy,
};

/**
 * Clases de Tailwind por eje, escritas completas. NO se pueden interpolar (`bg-${color}`): el
 * JIT de Tailwind escanea literales en el código fuente y una clase construida en runtime no
 * llega nunca a la hoja de estilos. Por eso `COLOR_POR_EJE` (el token) vive en el módulo puro
 * para documentación y tests, y aquí están las clases reales que se pintan.
 */
const CLASES_EJE: Record<EjeInsignia, { fondo: string; texto: string; barra: string }> = {
  coleccion: { fondo: "bg-brand-red/15", texto: "text-brand-red", barra: "bg-brand-red" },
  comunidad: { fondo: "bg-brand-yellow/15", texto: "text-brand-yellow", barra: "bg-brand-yellow" },
  escaparate: { fondo: "bg-brand-blue/15", texto: "text-brand-blue", barra: "bg-brand-blue" },
  competicion: { fondo: "bg-brand-green/15", texto: "text-brand-green", barra: "bg-brand-green" },
  rareza: { fondo: "bg-brand-purple/15", texto: "text-brand-purple", barra: "bg-brand-purple" },
  podio: { fondo: "bg-brand-teal/15", texto: "text-brand-teal", barra: "bg-brand-teal" },
};

/** Color del aro por tramo. Metales reconocibles; el V se va al morado de marca (diamante). */
const COLOR_ARO: Record<number, string> = {
  1: "#B87333",
  2: "#9BA3AF",
  3: "#E8A927",
  4: "#5FD1C6",
  5: "#8C43C4",
};

const ROMANO: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

export function nombreTramo(tramo: number | null): string | null {
  if (tramo === null) return null;
  return ROMANO[tramo] ?? String(tramo);
}

/**
 * Separador de millares al estilo español (12480 -> "12.480").
 *
 * No se usa `toLocaleString("es-ES")` a propósito: depende de que el runtime tenga los datos de
 * ICU de ese locale, y un Node compilado con `small-icu` devuelve el número sin agrupar y sin
 * avisar (detectado al ejecutar la suite: `2480` en vez de `2.480`). El formato de un contador
 * de la interfaz no puede depender de cómo esté compilado el runtime.
 */
export function formatearNumero(n: number): string {
  const entero = Math.trunc(Math.abs(n)).toString();
  const agrupado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return n < 0 ? `-${agrupado}` : agrupado;
}

export function textoProgreso(insignia: InsigniaEvaluada): string | null {
  if (!insignia.progreso) return null;
  const { valor, objetivo, unidad } = insignia.progreso;
  return `${formatearNumero(valor)} / ${formatearNumero(objetivo)} ${unidad}`;
}

export default function BadgeMedal({
  insignia,
  mostrarProgreso = true,
}: {
  insignia: InsigniaEvaluada;
  /** El Mosaico pinta medallas ya ganadas por otros: no hay progreso que enseñar ahí. */
  mostrarProgreso?: boolean;
}) {
  const Icono = ICONOS[insignia.icono];
  const clases = CLASES_EJE[insignia.eje];
  const romano = nombreTramo(insignia.tramo);
  const progreso = textoProgreso(insignia);
  const aro = insignia.tramo !== null ? COLOR_ARO[insignia.tramo] : null;

  const etiqueta = [
    insignia.nombre,
    insignia.desbloqueada ? "desbloqueada" : "bloqueada",
    romano ? `nivel ${romano}` : null,
    !insignia.desbloqueada && progreso ? progreso : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col items-center text-center gap-2 w-full" aria-label={etiqueta} role="group">
      <div className="relative">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center border-[3px] ${
            insignia.desbloqueada
              ? `border-foreground ${clases.fondo} ${clases.texto} shadow-[3px_3px_0px_0px_var(--foreground)]`
              : "border-dashed border-foreground/30 bg-transparent text-foreground/30"
          }`}
          style={
            insignia.desbloqueada && aro
              ? { outline: `3px solid ${aro}`, outlineOffset: "3px" }
              : undefined
          }
        >
          {Icono ? <Icono size={34} strokeWidth={2.25} aria-hidden="true" /> : null}
        </div>

        {romano && (
          <span
            className={`absolute -bottom-1 -right-1 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-foreground ${
              insignia.desbloqueada ? "bg-panel text-foreground" : "bg-background text-foreground/40"
            }`}
          >
            {romano}
          </span>
        )}
      </div>

      <div className="min-w-0 w-full">
        <p
          className={`font-black text-sm leading-tight ${
            insignia.desbloqueada ? "text-foreground" : "text-foreground/50"
          }`}
        >
          {insignia.nombre}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">{insignia.familia}</p>
      </div>

      {mostrarProgreso && !insignia.desbloqueada && insignia.progreso && (
        <div className="w-full max-w-[10rem]">
          <div className="h-2 w-full rounded-full border-2 border-foreground/30 overflow-hidden bg-black/5 dark:bg-white/5">
            <div
              className={`h-full ${clases.barra}`}
              style={{ width: `${Math.round(fraccionProgreso(insignia) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-bold text-foreground/60 tabular-nums">{progreso}</p>
        </div>
      )}
    </div>
  );
}
