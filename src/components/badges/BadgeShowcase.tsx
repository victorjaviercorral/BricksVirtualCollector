"use client";

import { Info } from "lucide-react";

export default function BadgeShowcase() {
  const badges = [
    { id: 1, name: "Primeros Pasos", description: "Configuraste tu perfil y subiste tu primer set.", unlocked: true, level: 1, category: "Comunidad" },
    { id: 2, name: "Veterano (1 Año)", description: "Celebramos tu primer año en la comunidad.", unlocked: false, level: 0, category: "Aniversarios" },
    { id: 3, name: "Cazador de Bounties", description: "Completaste 10 Bounties.", unlocked: true, level: 2, category: "Bounties" },
    { id: 4, name: "Vitrina Destacada", description: "Tu vitrina fue destacada por la comunidad.", unlocked: false, level: 0, category: "Curation" },
  ];

  return (
    <div className="bg-panel border-2 border-foreground rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Mis Insignias</h2>
        <span className="text-sm font-bold text-foreground/60 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
          2 / 24 Desbloqueadas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {badges.map((badge) => (
          <div 
            key={badge.id} 
            className={`relative group flex flex-col items-center text-center gap-3 p-4 rounded-xl transition-all ${
              badge.unlocked 
                ? 'hover:bg-black/5 dark:hover:bg-white/5' 
                : 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
            }`}
          >
            {/* Representación visual de la insignia */}
            <div className={`w-20 h-20 rounded-2xl border-4 flex items-center justify-center transform transition-transform group-hover:scale-110 ${
              badge.unlocked ? 'border-brand-yellow bg-brand-yellow/10' : 'border-foreground/20 bg-black/5 dark:bg-white/5'
            }`}>
              <div className="w-12 h-12 bg-foreground/10 rounded-full" />
            </div>

            <div>
              <p className="font-bold text-sm leading-tight mb-1">{badge.name}</p>
              <p className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">{badge.category}</p>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute top-full mt-2 w-48 bg-foreground text-background text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none shadow-lg">
              <div className="flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>{badge.description}</p>
              </div>
              {badge.level > 0 && (
                <div className="mt-2 pt-2 border-t border-background/20 font-bold text-[10px] uppercase tracking-wider text-brand-yellow">
                  Insignia Nivel {badge.level}
                </div>
              )}
              {/* Tooltip Arrow */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
