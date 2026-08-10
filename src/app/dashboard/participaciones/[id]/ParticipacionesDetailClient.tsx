"use client";

import { CheckCircle2, Clock, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ParticipacionesDetailClient({ participacion }: { participacion: any }) {
  const [isUploading, setIsUploading] = useState(false);

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
          {/* Hero Image */}
          <div className="bg-brand-blue rounded-xl overflow-hidden border-[3px] border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] w-full sm:w-64 h-40 flex shrink-0 items-center justify-center relative">
            {/* Si tuviera imagen la ponemos aquí */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 mix-blend-overlay">
               <span className="font-display font-black text-6xl">LEGO</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black leading-tight uppercase tracking-tight text-balance">
            {participacion.titulo}
          </h1>
        </div>

        {/* Points Badge */}
        <div className="shrink-0 flex flex-col justify-center items-center leading-tight bg-brand-blue text-white w-32 h-32 neo-brutalism" 
             style={{ clipPath: 'polygon(50% 0%, 61% 9%, 76% 5%, 83% 19%, 98% 21%, 95% 36%, 100% 50%, 95% 64%, 98% 79%, 83% 81%, 76% 95%, 61% 91%, 50% 100%, 39% 91%, 24% 95%, 17% 81%, 2% 79%, 5% 64%, 0% 50%, 5% 36%, 2% 21%, 17% 19%, 24% 5%, 39% 9%)', borderRadius: 0, boxShadow: 'none', border: 'none' }}
        >
          {/* Un wrapper para simular el borde en un clip-path complejo no es trivial en CSS estándar sin SVG, así que lo dejamos como caja estrellada simple */}
          <span className="text-3xl font-black">{participacion.recompensa}</span>
          <span className="text-xs font-bold uppercase tracking-widest mt-1">Puntos</span>
        </div>
      </article>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Mission & Rules */}
        <div className="space-y-6">
          <article className="bg-panel neo-brutalism p-6 sm:p-8">
            <h2 className="font-display text-2xl font-black mb-3 uppercase tracking-tight border-b-2 border-foreground/10 pb-2">Misión</h2>
            <p className="text-lg font-medium text-foreground/80 leading-relaxed">
              {participacion.descripcion}
            </p>
          </article>

          <article className="bg-panel neo-brutalism p-6 sm:p-8">
            <h2 className="font-display text-2xl font-black mb-4 uppercase tracking-tight border-b-2 border-foreground/10 pb-2">Reglas</h2>
            <ul className="space-y-3 text-lg font-medium text-foreground/80 list-disc pl-5 marker:text-brand-red">
              {participacion.requisitos.map((req: any) => (
                <li key={req.id}>{req.texto}</li>
              ))}
            </ul>
          </article>
        </div>

        {/* Right Column: Progress */}
        <div className="space-y-6">
          <article className="bg-panel neo-brutalism p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">Tu Progreso</h2>
              <span className="text-3xl font-black text-brand-blue">{participacion.progreso}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-6 w-full bg-black/5 dark:bg-white/5 rounded-full border-2 border-foreground overflow-hidden mb-8 shadow-[2px_2px_0px_0px_var(--foreground)]">
              <div 
                className="h-full bg-brand-blue border-r-2 border-foreground" 
                style={{ width: `${participacion.progreso}%` }}
              />
            </div>
            
            {/* Progress List */}
            <ul className="space-y-4 mb-10 text-lg font-medium">
              {participacion.tareas.map((tarea: any) => (
                <li key={tarea.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border-2 border-transparent">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full border-2 border-foreground ${tarea.estado === 'aprobado' ? 'bg-brand-green' : 'bg-brand-yellow'}`}></div>
                    <span>{tarea.texto} <span className="text-sm font-bold opacity-50 uppercase ml-2">({tarea.estado})</span></span>
                  </div>
                  {tarea.estado === 'aprobado' ? (
                    <div className="bg-brand-green rounded-full w-8 h-8 flex items-center justify-center text-white border-2 border-foreground shadow-sm">
                      <CheckCircle2 size={18} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="bg-brand-yellow rounded-full w-8 h-8 flex items-center justify-center text-foreground border-2 border-foreground shadow-sm">
                      <Clock size={18} strokeWidth={3} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <button 
              onClick={() => setIsUploading(!isUploading)}
              className="w-full bg-brand-blue text-white py-4 px-6 rounded-full font-black uppercase tracking-widest text-lg neo-brutalism-sm hover:bg-brand-blue/90 hover:-translate-y-1 transition-transform"
            >
              {isUploading ? "Subiendo..." : "Subir Nueva Participación"}
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}
