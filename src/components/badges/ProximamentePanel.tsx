"use client";

import { Sparkles } from "lucide-react";

/**
 * Estado vacío honesto para funcionalidades que la interfaz ya anticipa pero que no tienen
 * lógica ni esquema real detrás todavía (decisión D3, Iteración 4: BadgeShowcase y
 * CommunityMosaic mostraban logros y bloques inventados -- "2/24 Desbloqueadas", un mosaico de
 * 40 casillas simuladas). En vez de fingir progreso, se declara explícitamente que está en
 * diseño. Ver docs/05-plan/plan-intervencion-post-iteracion-3.md (D3) para el porqué se dejaron
 * fuera de esta iteración: cada una es un producto nuevo por diseñar (criterios de 24 logros,
 * mecánica del mosaico), no una tarea de "conectar a datos reales" como sí lo fue el Pasaporte
 * de Exposiciones (ExhibitionPassport.tsx), que sí tenía tabla y disparador ya definidos.
 */
export default function ProximamentePanel({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="bg-panel border-2 border-dashed border-foreground/30 rounded-2xl p-12 sm:p-16 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-yellow/10 text-brand-yellow flex items-center justify-center">
        <Sparkles size={32} />
      </div>
      <h2 className="text-2xl font-display font-bold uppercase tracking-tight">{titulo}</h2>
      <p className="text-foreground/60 max-w-md">{descripcion}</p>
      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 text-foreground/50">
        Próximamente
      </span>
    </div>
  );
}
