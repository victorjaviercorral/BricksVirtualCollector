"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useTour } from "./TourProvider";
import { computeTooltipPosition, type Rect } from "./geometry";

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_MARGIN = 14;
const TARGET_TIMEOUT_MS = 2500;

function measure(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

interface Measurement {
  step: number;
  rect: Rect | null;
  /** true = el objetivo no apareció a tiempo: tooltip centrado sin spotlight. */
  fallback: boolean;
}

export function TourOverlay() {
  const { steps, stepIndex, next, prev, close } = useTour();
  const step = steps[stepIndex];
  const reduceMotion = useReducedMotion();

  const [measured, setMeasured] = useState<Measurement>({ step: -1, rect: null, fallback: false });
  const [isMobile, setIsMobile] = useState(false);
  const [tipSize, setTipSize] = useState({ w: 360, h: 220 });

  const targetElRef = useRef<Element | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  // Medición vigente solo si corresponde al paso actual; si no, aún no hay rect.
  const current: Measurement =
    measured.step === stepIndex ? measured : { step: stepIndex, rect: null, fallback: false };
  const noTarget = !step.target;
  const fallbackCentered = noTarget || current.fallback;
  const rect = current.rect;

  // Bloqueo del scroll del body mientras el tour está activo.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Viewport: distingue móvil para anclar el tooltip abajo a ancho completo.
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Teclado: Esc cierra, flechas navegan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, next, prev]);

  // Localiza el objetivo del paso actual. Sondea el DOM porque tras un cambio de ruta el
  // elemento puede tardar en montar. Si no aparece a tiempo, degrada a tooltip centrado.
  useEffect(() => {
    if (!step.target) return;

    let cancelled = false;
    let timer = 0;
    targetElRef.current = null;
    const targetSelector = step.target;
    const deadline = Date.now() + TARGET_TIMEOUT_MS;

    const tryFind = () => {
      if (cancelled) return;
      const el = document.querySelector(targetSelector);
      if (el) {
        targetElRef.current = el;
        el.scrollIntoView({
          block: "center",
          inline: "center",
          behavior: reduceMotion ? "auto" : "smooth",
        });
        window.setTimeout(
          () => {
            if (!cancelled && targetElRef.current) {
              setMeasured({ step: stepIndex, rect: measure(targetElRef.current), fallback: false });
            }
          },
          reduceMotion ? 0 : 220
        );
        return;
      }
      if (Date.now() > deadline) {
        if (!cancelled) setMeasured({ step: stepIndex, rect: null, fallback: true });
        return;
      }
      timer = window.setTimeout(tryFind, 120);
    };
    tryFind();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [step.target, stepIndex, reduceMotion]);

  // Re-mide el objetivo cuando cambia el viewport o el scroll.
  useEffect(() => {
    const remeasure = () => {
      const el = targetElRef.current;
      if (el) setMeasured({ step: stepIndex, rect: measure(el), fallback: false });
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [stepIndex]);

  // Mide el tooltip para poder colocarlo respecto al objetivo.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTipSize((prev) => (prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }));
  }, [stepIndex, rect, fallbackCentered, isMobile]);

  // Foco al panel del tour para lectores de pantalla y navegación por teclado.
  useEffect(() => {
    tipRef.current?.focus();
  }, [stepIndex]);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const tipPos = computeTooltipPosition(
    fallbackCentered ? null : rect,
    { w: tipSize.w, h: tipSize.h },
    { width: vw, height: vh },
    step.placement,
    isMobile,
    TOOLTIP_MARGIN
  );

  if (typeof document === "undefined") return null;

  const isLast = stepIndex === steps.length - 1;
  const showSpotlight = rect !== null && !fallbackCentered;

  const overlay = (
    <div className="fixed inset-0 z-[60]" role="presentation">
      {/* Capa que oscurece y captura clics fuera del objetivo (el tour es explicativo: se
          bloquea la interacción con la página por debajo). */}
      <button
        type="button"
        aria-label="Cerrar el tour"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default bg-black/55 focus:outline-none"
        style={showSpotlight ? { background: "transparent" } : undefined}
      />

      {/* Spotlight: recorta un hueco sobre el objetivo mediante una sombra gigante. */}
      <AnimatePresence>
        {showSpotlight && rect && (
          <motion.div
            key="spotlight"
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 0 } : false}
            animate={{
              opacity: 1,
              top: rect.top - SPOTLIGHT_PADDING,
              left: rect.left - SPOTLIGHT_PADDING,
              width: rect.width + SPOTLIGHT_PADDING * 2,
              height: rect.height + SPOTLIGHT_PADDING * 2,
            }}
            exit={{ opacity: 0 }}
            transition={
              reduceMotion ? { duration: 0.12 } : { type: "spring", stiffness: 380, damping: 34 }
            }
            className="pointer-events-none absolute rounded-2xl"
            style={{
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              outline: "2px solid var(--foreground)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Anuncio para lectores de pantalla. */}
      <div className="sr-only" aria-live="polite">
        {`Paso ${stepIndex + 1} de ${steps.length}. ${step.title}. ${step.body}`}
      </div>

      {/* Tooltip / coachmark. */}
      <motion.div
        ref={tipRef}
        key={step.id}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-tip-title"
        aria-describedby="tour-tip-body"
        tabIndex={-1}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reduceMotion ? { duration: 0.14 } : { type: "spring", stiffness: 460, damping: 30 }
        }
        className="absolute w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-2 border-foreground bg-panel p-5 shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA]"
        style={{
          top: tipPos.top,
          left: tipPos.left,
          right: tipPos.fullWidth ? 16 : undefined,
          width: tipPos.fullWidth ? "auto" : undefined,
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-foreground/50">
            Paso {stepIndex + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar el tour"
            className="rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <h2 id="tour-tip-title" className="mb-1.5 font-display text-lg font-bold leading-tight">
          {step.title}
        </h2>
        <p id="tour-tip-body" className="text-sm leading-relaxed text-foreground/80">
          {step.body}
        </p>

        {step.masSlug && (
          <Link
            href={`/como-funciona/${step.masSlug}`}
            onClick={close}
            className="mt-2 inline-block text-xs font-bold text-brand-blue underline underline-offset-2 hover:text-brand-blue/80"
          >
            Saber más
          </Link>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="text-xs font-medium text-foreground/50 transition-colors hover:text-foreground"
          >
            Saltar tour
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={prev}
                className="flex items-center gap-1 rounded-lg border-2 border-foreground bg-panel px-3 py-1.5 text-xs font-bold transition-transform hover:-translate-y-0.5"
              >
                <ArrowLeft size={14} /> Anterior
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1 rounded-lg border-2 border-foreground bg-brand-blue px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0px_0px_#0F172A] transition-transform hover:-translate-y-0.5 dark:shadow-[2px_2px_0px_0px_#F8F9FA]"
            >
              {isLast ? "Terminar" : "Siguiente"}
              {!isLast && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(overlay, document.body);
}
