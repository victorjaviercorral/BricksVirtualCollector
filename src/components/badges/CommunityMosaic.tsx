"use client";

import { Info, Box } from "lucide-react";

export default function CommunityMosaic() {
  // Simulamos un grid de 10x4 para el mosaico (40 bloques)
  const blocks = Array.from({ length: 40 }, (_, i) => {
    // Simulamos que el usuario logueado ha colocado 3 bloques
    const isUserBlock = i === 12 || i === 25 || i === 38;
    // Simulamos que otros usuarios han colocado bloques
    const isOtherUserBlock = i % 5 === 0 || i % 7 === 0;
    
    return {
      id: i,
      owner: isUserBlock ? "Tú" : isOtherUserBlock ? "Usuario Anónimo" : null,
      color: isUserBlock ? "bg-brand-red" : isOtherUserBlock ? "bg-brand-blue/30" : "bg-black/5 dark:bg-white/5",
      reason: isUserBlock ? "1 Año en la comunidad" : isOtherUserBlock ? "Participación destacada" : null
    };
  });

  return (
    <div className="bg-panel border-2 border-foreground rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight flex items-center gap-2">
            <Box className="text-brand-blue" />
            El Mosaico Comunitario
          </h2>
          <p className="text-sm text-foreground/70">Un bloque por cada hito importante. Deja tu legado en el museo.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg">
          <div className="w-3 h-3 bg-brand-red rounded-sm" />
          <span>Tus Bloques (3)</span>
        </div>
      </div>

      <div className="bg-foreground/5 p-4 sm:p-8 rounded-xl border border-foreground/10 overflow-x-auto">
        <div className="min-w-[600px] grid grid-cols-10 gap-2">
          {blocks.map((block) => (
            <div 
              key={block.id}
              className={`relative group aspect-square rounded-sm border border-black/10 dark:border-white/10 transition-transform ${block.color} ${block.owner ? 'hover:scale-110 shadow-sm cursor-help' : 'opacity-50'}`}
            >
              {/* Studs (Clavos del bloque de Lego) */}
              <div className="absolute inset-2 border border-black/10 dark:border-white/10 rounded-full opacity-50" />
              
              {/* Tooltip */}
              {block.owner && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-foreground text-background text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-lg">
                  <p className="font-bold text-brand-yellow mb-1">{block.owner}</p>
                  <p>{block.reason}</p>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 flex items-start gap-3 text-sm text-foreground/70 bg-brand-blue/5 p-4 rounded-xl">
        <Info className="text-brand-blue shrink-0 mt-0.5" size={20} />
        <p>
          <strong className="text-foreground">¿Cómo conseguir un bloque?</strong> 
          {" "}Completa Bounties de alta dificultad, alcanza tu primer año en la plataforma, o clasifícate en el Top 3 de una Exposición Oficial.
        </p>
      </div>
    </div>
  );
}
