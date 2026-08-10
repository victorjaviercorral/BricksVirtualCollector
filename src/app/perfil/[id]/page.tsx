"use client";
import { MOCK_USER, MOCK_SETS } from "@/lib/data";
import { Trophy, CheckCircle2, CalendarDays, Play, X, ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import * as motion from "framer-motion/client";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { use, useState } from "react";

export default function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const user = MOCK_USER;
  
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const nextSlide = () => setTourIndex((prev) => (prev + 1) % MOCK_SETS.length);
  const prevSlide = () => setTourIndex((prev) => (prev - 1 + MOCK_SETS.length) % MOCK_SETS.length);

  return (
    <div className="flex flex-col gap-10 pb-20">
      
      {/* Tour Overlay */}
      {isTourActive && (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
          <div className="p-6 flex justify-between items-center absolute top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div>
              <p className="font-bold text-xl">{MOCK_SETS[tourIndex].name}</p>
              <p className="text-white/60 font-mono text-sm">Vitrina {tourIndex + 1} de {MOCK_SETS.length}</p>
            </div>
            <button onClick={() => setIsTourActive(false)} aria-label="Cerrar tour" className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <button onClick={prevSlide} aria-label="Anterior" className="absolute left-4 sm:left-8 z-10 p-4 rounded-full bg-black/50 hover:bg-black/80 transition-colors">
              <ChevronLeft size={32} />
            </button>
            
            <img 
              key={tourIndex}
              src={MOCK_SETS[tourIndex].image} 
              alt={MOCK_SETS[tourIndex].name}
              className="w-full h-full object-contain animate-in fade-in duration-700" 
            />
            
            <button onClick={nextSlide} aria-label="Siguiente" className="absolute right-4 sm:right-8 z-10 p-4 rounded-full bg-black/50 hover:bg-black/80 transition-colors">
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <section className="flex flex-col items-center text-center mt-8">
        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-brand-yellow via-brand-red to-brand-blue flex items-center justify-center text-white text-5xl font-display font-bold shadow-xl mb-6 relative">
          {user.alias.charAt(0)}
          {user.verified && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-green rounded-full border-4 border-background flex items-center justify-center text-white shadow-sm" title="Coleccionista Verificado">
              <CheckCircle2 size={20} />
            </div>
          )}
        </div>
        <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3 justify-center">
          {user.alias}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm font-medium text-black/60 dark:text-white/60 mb-6">
          <span className="font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded">#{user.id}</span>
          <span className="flex items-center gap-1"><CalendarDays size={14}/> Coleccionista desde {user.joinDate.split("-")[0]}</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="px-6 py-3 glass rounded-2xl text-center">
            <p className="text-xl font-bold font-display text-brand-blue">{user.totalSets}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-black/50">Vitrinas</p>
          </div>
          <div className="px-6 py-3 glass rounded-2xl text-center">
            <p className="text-xl font-bold font-display text-brand-yellow">{user.totalPieces.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-black/50">Piezas</p>
          </div>
          <div className="px-6 py-3 glass rounded-2xl text-center">
            <p className="text-xl font-bold font-display text-brand-red">{user.totalBricks.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-black/50">Bricks (Likes)</p>
          </div>
        </div>

        <button 
          onClick={() => setIsTourActive(true)}
          className="px-8 py-4 rounded-full bg-foreground text-background font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <Play size={18} className="fill-background" /> Iniciar Visita Guiada
        </button>
      </section>

      {/* Grid */}
      <section className="mt-8">
        <h2 className="text-2xl font-display font-bold mb-6 text-center">Colección Pública</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {MOCK_SETS.map((set, index) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/set/${set.id}`} className="group flex flex-col gap-4">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 shadow-sm">
                  <img
                    src={set.image}
                    alt={set.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {set.featured && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-yellow text-white flex items-center justify-center shadow-md">
                      <Trophy size={14} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm text-xs font-semibold shadow-sm text-black">
                    {set.theme}
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="font-display font-bold text-lg leading-tight group-hover:text-brand-blue transition-colors mb-2">
                    {set.name}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
                    <span className="font-mono text-xs">#{set.id}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-brand-red font-semibold"><Heart size={14} className="fill-brand-red/20"/> {set.bricks}</span>
                      <span className="flex items-center gap-1"><Eye size={14}/> {set.views}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}