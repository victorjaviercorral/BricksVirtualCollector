"use client";

import { CheckCircle2, ChevronLeft, Tag, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ParticipacionDetail {
  id: string;
  nombreSet: string;
  tematica: string | null;
  recompensa: number;
  estado: string;
  fechaReclamo: string | null;
  set: { id: string; nombre: string } | null;
}

export default function ParticipacionesDetailClient({ participacion }: { participacion: ParticipacionDetail }) {
  const fecha = participacion.fechaReclamo
    ? format(new Date(participacion.fechaReclamo), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null;

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/dashboard/participaciones" className="inline-flex items-center gap-2 bg-panel neo-brutalism-sm px-6 py-3 font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft size={20} />
          Volver a Participaciones
        </Link>
      </div>

      {/* Hero Card */}
      <article className="bg-panel neo-brutalism p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full md:w-auto">
          <div className="bg-brand-blue rounded-xl overflow-hidden border-[3px] border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] w-full sm:w-64 h-40 flex shrink-0 items-center justify-center relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-20 mix-blend-overlay">
               <span className="font-display font-black text-6xl">LEGO</span>
            </div>
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black leading-tight uppercase tracking-tight text-balance">
              {participacion.nombreSet}
            </h1>
            {participacion.tematica && (
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm">
                <Tag size={14} /> {participacion.tematica}
              </span>
            )}
          </div>
        </div>

        {/* Points Badge */}
        <div className="shrink-0 flex flex-col justify-center items-center leading-tight bg-brand-blue text-white w-32 h-32 neo-brutalism"
             style={{ clipPath: 'polygon(50% 0%, 61% 9%, 76% 5%, 83% 19%, 98% 21%, 95% 36%, 100% 50%, 95% 64%, 98% 79%, 83% 81%, 76% 95%, 61% 91%, 50% 100%, 39% 91%, 24% 95%, 17% 81%, 2% 79%, 5% 64%, 0% 50%, 5% 36%, 2% 21%, 17% 19%, 24% 5%, 39% 9%)', borderRadius: 0, boxShadow: 'none', border: 'none' }}
        >
          <span className="text-3xl font-black">{participacion.recompensa}</span>
          <span className="text-xs font-bold uppercase tracking-widest mt-1">Bricks</span>
        </div>
      </article>

      {/* Detalle del reclamo -- solo datos reales: no hay checklist de tareas ni progreso, un
          reclamo de bounty es un evento único (reclamar -> recompensa concedida al instante). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="bg-panel neo-brutalism p-6 sm:p-8">
          <h2 className="font-display text-2xl font-black mb-4 uppercase tracking-tight border-b-2 border-foreground/10 pb-2">
            Detalle del reclamo
          </h2>
          <ul className="space-y-4 text-lg font-medium">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="text-brand-green shrink-0" size={22} />
              <span>
                Reclamado
                {fecha && <span className="text-foreground/60"> el {fecha}</span>}
              </span>
            </li>
            {participacion.set && (
              <li className="flex items-center gap-3">
                <Package className="text-brand-blue shrink-0" size={22} />
                <span>
                  Con el set{" "}
                  <Link href={`/set/${participacion.set.id}`} className="text-brand-blue font-bold hover:underline">
                    {participacion.set.nombre}
                  </Link>
                </span>
              </li>
            )}
            {fecha && (
              <li className="flex items-center gap-3 text-foreground/60 text-base">
                <Calendar className="shrink-0" size={20} />
                <span>{fecha}</span>
              </li>
            )}
          </ul>
        </article>

        <article className="bg-panel neo-brutalism p-6 sm:p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <p className="text-2xl font-black mb-1">+{participacion.recompensa} Bricks</p>
          <p className="text-foreground/60 font-bold">concedidos a tu set al reclamar este bounty</p>
        </article>
      </div>
    </div>
  );
}
