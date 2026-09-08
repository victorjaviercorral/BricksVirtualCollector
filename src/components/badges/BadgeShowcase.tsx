"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock, Sparkles } from "lucide-react";
import BadgeMedal from "./BadgeMedal";
import { TOTAL_INSIGNIAS, type ResultadoInsignias } from "@/lib/insignias-usuario";

/**
 * La Vitrina de Insignias.
 *
 * Antes de esto mostraba 4 logros inventados de un supuesto total de 24 ("2/24 Desbloqueadas"),
 * sin ninguna tabla ni criterio detrás; la decisión D3 (Iteración 4) la dejó en un estado vacío
 * honesto (`ProximamentePanel`) a la espera de que existiera el sistema. Ahora cada medalla sale
 * de `src/lib/insignias-usuario.ts`, evaluado contra datos reales del usuario.
 *
 * El reparto en tres bloques es deliberado y responde al problema que D3 corrigió: enseñar
 * decenas de casillas grises no motiva, desanima. Aquí solo llevan medalla y barra los objetivos
 * en los que ya hay avance real; el resto de criterios se listan como texto, visibles pero sin
 * ocupar la pantalla con huecos.
 */
export default function BadgeShowcase({
  insignias,
  avisoPiezas,
}: {
  insignias: ResultadoInsignias;
  /** Aviso honesto si hay sets sin nº de piezas: el total de la familia Cantera se queda corto. */
  avisoPiezas?: string | null;
}) {
  const [verOtras, setVerOtras] = useState(false);
  const { desbloqueadas, proximosObjetivos, otrasFamilias } = insignias;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-black uppercase tracking-tight">Vitrina de Insignias</h2>
        <p className="text-sm font-bold text-foreground/60 tabular-nums">
          {desbloqueadas.length} de {TOTAL_INSIGNIAS} desbloqueadas
        </p>
      </div>

      {avisoPiezas && (
        <p className="text-sm font-bold text-foreground/70 bg-brand-yellow/10 border-2 border-brand-yellow/40 rounded-xl px-4 py-3">
          {avisoPiezas}{" "}
          <Link href="/mesa-de-trabajo" className="text-brand-blue hover:underline">
            Completar en Mesa de Trabajo
          </Link>
        </p>
      )}

      {desbloqueadas.length > 0 ? (
        <section aria-labelledby="titulo-desbloqueadas">
          <h3 id="titulo-desbloqueadas" className="sr-only">
            Insignias desbloqueadas
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
            {desbloqueadas.map((i) => (
              <BadgeMedal key={i.id} insignia={i} />
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-panel border-2 border-dashed border-foreground/30 rounded-2xl p-10 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-yellow/10 text-brand-yellow flex items-center justify-center">
            <Sparkles size={28} />
          </div>
          <p className="font-black text-lg">Aún no has desbloqueado ninguna insignia</p>
          <p className="text-foreground/60 max-w-md text-sm font-bold">
            Documenta un set, publica una vitrina o da tu primer brick a otro coleccionista: casi
            todas las familias se abren con el primer paso.
          </p>
        </section>
      )}

      {proximosObjetivos.length > 0 && (
        <section aria-labelledby="titulo-objetivos">
          <h3 id="titulo-objetivos" className="font-display text-lg font-black uppercase tracking-tight mb-6">
            Tu próximo objetivo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
            {proximosObjetivos.map((i) => (
              <BadgeMedal key={i.id} insignia={i} />
            ))}
          </div>
        </section>
      )}

      {otrasFamilias.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setVerOtras(!verOtras)}
            aria-expanded={verOtras}
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground/70 hover:text-foreground transition-colors"
          >
            <Lock size={16} />
            Otras formas de ganar insignias ({otrasFamilias.length})
            <ChevronDown size={16} className={verOtras ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {verOtras && (
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2">
              {otrasFamilias.map((i) => (
                <li key={i.id} className="text-sm text-foreground/70 border-b border-foreground/10 py-2">
                  <span className="font-black text-foreground">{i.nombre}</span>
                  <span className="text-foreground/50"> — {i.criterio}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
