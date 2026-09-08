"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Award, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ParticipacionActiva, PosicionVivo } from "@/lib/queries/insignias-usuario";

/**
 * Lo que el usuario tiene en juego AHORA: sus sets en exposiciones activas, con el estado de
 * moderación, el puesto en el ranking en vivo y el tiempo que queda.
 *
 * Migrado desde `/dashboard/participaciones` ("Mi Progreso") al fusionar esa pantalla aquí:
 * repetía cabecera, avatar y estadísticas de "Mis Insignias", la duplicación que prohíbe la
 * regla 2 de AGENTS.md.
 *
 * Solo exposiciones ACTIVAS. El histórico cerrado vive en el Pasaporte y no se repinta aquí
 * (fuente única desde H5). Los bounties reclamados tampoco están aquí: un reclamo no es
 * actividad pendiente -- la recompensa se concede al instante -- así que viven en Recompensas.
 */

export function tiempoRestante(expo: ParticipacionActiva["exposiciones_temporales"]): string | null {
  if (!expo) return null;
  if (expo.es_continua || !expo.fecha_fin) return "Exposición continua";
  const distancia = new Date(expo.fecha_fin).getTime() - Date.now();
  if (distancia <= 0) return "Cierre inminente";
  const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
  if (dias >= 1) return `Quedan ${dias} día${dias === 1 ? "" : "s"}`;
  const horas = Math.floor(distancia / (1000 * 60 * 60));
  return `Quedan ${horas} h`;
}

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  aprobado: { texto: "En el ranking", clase: "text-brand-green" },
  rechazado: { texto: "No aprobado", clase: "text-brand-red" },
  pendiente: { texto: "En revisión", clase: "text-brand-yellow" },
};

export default function ActividadEnCurso({
  participaciones,
  posiciones,
}: {
  participaciones: ParticipacionActiva[];
  posiciones: Record<string, PosicionVivo | null>;
}) {
  const [retirando, setRetirando] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleRetirar = async (id: string) => {
    if (!confirm("¿Seguro que quieres retirar este set de la exposición?")) return;
    setRetirando(id);

    const { error } = await supabase.from("exposicion_sets").delete().eq("id", id);

    if (error) {
      toast.error("Error al retirar la participación");
    } else {
      toast.success("Participación retirada con éxito");
      router.refresh();
    }
    setRetirando(null);
  };

  if (participaciones.length === 0) {
    return (
      <div className="bg-panel border-2 border-dashed border-foreground/30 rounded-2xl p-10 flex flex-col items-center text-center gap-4">
        <p className="font-black text-lg">No tienes nada en juego ahora mismo</p>
        <p className="text-foreground/60 max-w-md text-sm font-bold">
          Apunta un set a una exposición activa y sigue aquí tu puesto en el ranking en vivo.
        </p>
        <Link
          href="/exposiciones"
          className="bg-brand-blue text-white font-black py-3 px-6 rounded-full neo-brutalism-sm hover:-translate-y-1 transition-transform"
        >
          Ver exposiciones
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {participaciones.map((expo) => {
        const pos = posiciones[expo.id];
        const tiempo = tiempoRestante(expo.exposiciones_temporales);
        const estado = ETIQUETA_ESTADO[expo.estado] ?? ETIQUETA_ESTADO.pendiente;

        return (
          <article key={expo.id} className="bg-panel rounded-2xl neo-brutalism p-5 flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl border-[3px] border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] overflow-hidden shrink-0">
                <img
                  src={expo.exposiciones_temporales?.imagen_url || "/placeholder-expo.jpg"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xl leading-tight mb-1">
                  <Link href={`/exposicion/${expo.exposicion_id}`} className="hover:underline">
                    {expo.exposiciones_temporales?.titulo}
                  </Link>
                </h3>
                <p className="text-sm font-bold text-foreground/70">
                  Set:{" "}
                  <Link href={`/set/${expo.sets?.id}`} className="text-brand-blue hover:underline">
                    {expo.sets?.nombre}
                  </Link>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded border-2 border-foreground bg-black/5 dark:bg-white/5 text-xs font-bold uppercase">
                    {expo.estado === "aprobado" ? (
                      <CheckCircle2 size={14} className="text-brand-green" />
                    ) : (
                      <Clock size={14} className={estado.clase} />
                    )}
                    <span className={estado.clase}>{estado.texto}</span>
                  </span>
                  {pos && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded border-2 border-foreground bg-brand-yellow/20 text-xs font-black uppercase">
                      <Award size={14} className="text-brand-yellow" />#{pos.posicion} de {pos.total} · {pos.bricks} bricks
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-[3px] border-foreground/10 flex items-center justify-between">
              {tiempo && <span className="text-xs font-bold text-foreground/60">{tiempo}</span>}
              <button
                onClick={() => handleRetirar(expo.id)}
                disabled={retirando === expo.id}
                className="text-xs font-black uppercase flex items-center gap-1 text-brand-red hover:underline disabled:opacity-50"
              >
                <Trash2 size={14} /> Retirar Set
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
