"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";
import { filtrarVitrinasPorTema, tarjetaVitrina, type VitrinaCruda } from "@/lib/galeria";

export default function GaleriaClient({ vitrinas, temas }: { vitrinas: VitrinaCruda[]; temas: string[] }) {
  const [tema, setTema] = useState<string>("todas");
  const filtradas = filtrarVitrinasPorTema(vitrinas, tema).map(tarjetaVitrina);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-panel text-foreground px-4 py-2 rounded-xl border-2 border-foreground font-bold hover:bg-brand-yellow hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Volver
        </Link>

        <h1 className="font-display font-black text-4xl md:text-5xl mb-2">Galería de Vitrinas</h1>
        <p className="text-foreground/70 font-bold mb-8">
          Explora las colecciones públicas de la comunidad. Entra en cualquiera para ver sus sets.
        </p>

        {temas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setTema("todas")}
              className={`px-4 py-2 rounded-xl border-2 border-foreground font-bold text-sm transition-colors ${
                tema === "todas" ? "bg-foreground text-background" : "bg-panel hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Todas
            </button>
            {temas.map((t) => (
              <button
                key={t}
                onClick={() => setTema(t)}
                className={`px-4 py-2 rounded-xl border-2 border-foreground font-bold text-sm transition-colors ${
                  tema === t ? "bg-foreground text-background" : "bg-panel hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {filtradas.length === 0 ? (
          <div className="text-center py-24 bg-panel border-2 border-dashed border-foreground rounded-3xl">
            <LayoutGrid size={40} className="mx-auto text-foreground/30 mb-4" />
            <p className="font-display font-black text-2xl text-foreground/50">
              {vitrinas.length === 0 ? "Todavía no hay vitrinas públicas." : "Ninguna vitrina con esa temática."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtradas.map((v) => (
              <Link
                key={v.id}
                href={`/vitrina/${v.id}`}
                className="group bg-panel rounded-2xl border-2 border-foreground overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] dark:hover:shadow-[6px_6px_0px_0px_#F8F9FA] transition-all"
              >
                <div className="h-44 border-b-2 border-foreground overflow-hidden bg-black/5">
                  <img
                    src={v.portada}
                    alt={v.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-display font-bold text-xl leading-tight">{v.nombre}</h2>
                  <p className="font-mono text-xs text-foreground/60 mb-2">@{v.dueno}</p>
                  {v.descripcion && (
                    <p className="text-sm font-medium text-foreground/70 line-clamp-2 mb-3">{v.descripcion}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs font-bold text-foreground/60">
                    <span className="px-2 py-1 bg-foreground/5 dark:bg-foreground/10 rounded border border-foreground uppercase">
                      {v.numSets} {v.numSets === 1 ? "set" : "sets"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-brand-blue group-hover:gap-2 transition-all">
                      Ver vitrina <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
