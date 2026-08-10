"use client";

import { CalendarDays, Play, X, ChevronLeft, ChevronRight, Heart, PackageOpen } from "lucide-react";
import * as motion from "framer-motion/client";
import Link from "next/link";
import { useState } from "react";

interface PerfilSet {
  id: string;
  nombre: string;
  tematica: string | null;
  num_piezas: number | null;
  bricks_recibidos: number | null;
  fotos: { url: string }[] | null;
}

interface PerfilProfile {
  id: string;
  username: string | null;
  alias: string | null;
  avatar_url: string | null;
  total_bricks_recibidos: number | null;
  creado_en: string | null;
}

export default function PerfilPublicoClient({ profile, sets }: { profile: PerfilProfile; sets: PerfilSet[] }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const displayName = profile.alias || profile.username || "Coleccionista Anónimo";
  const joinYear = profile.creado_en ? new Date(profile.creado_en).getFullYear() : null;
  const totalPieces = sets.reduce((acc, s) => acc + (s.num_piezas || 0), 0);

  const nextSlide = () => setTourIndex((prev) => (prev + 1) % sets.length);
  const prevSlide = () => setTourIndex((prev) => (prev - 1 + sets.length) % sets.length);

  return (
    <div className="flex flex-col gap-10 pb-20">

      {/* Tour Overlay */}
      {isTourActive && sets.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
          <div className="p-6 flex justify-between items-center absolute top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div>
              <p className="font-bold text-xl">{sets[tourIndex].nombre}</p>
              <p className="text-white/60 font-mono text-sm">Vitrina {tourIndex + 1} de {sets.length}</p>
            </div>
            <button onClick={() => setIsTourActive(false)} aria-label="Cerrar tour" className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <button onClick={prevSlide} aria-label="Anterior" className="absolute left-4 sm:left-8 z-10 p-4 rounded-full bg-black/50 hover:bg-black/80 transition-colors">
              <ChevronLeft size={32} />
            </button>

            {sets[tourIndex].fotos?.[0]?.url ? (
              <img
                key={tourIndex}
                src={sets[tourIndex].fotos![0].url}
                alt={sets[tourIndex].nombre}
                className="w-full h-full object-contain animate-in fade-in duration-700"
              />
            ) : (
              <div className="flex flex-col items-center text-white/30">
                <PackageOpen size={64} />
                <p className="mt-2 font-bold">Sin foto</p>
              </div>
            )}

            <button onClick={nextSlide} aria-label="Siguiente" className="absolute right-4 sm:right-8 z-10 p-4 rounded-full bg-black/50 hover:bg-black/80 transition-colors">
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <section className="flex flex-col items-center text-center mt-8">
        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-brand-yellow via-brand-red to-brand-blue flex items-center justify-center text-white text-5xl font-display font-bold shadow-xl mb-6 relative overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3 justify-center">
          {displayName}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm font-medium text-black/60 dark:text-white/60 mb-6">
          {joinYear && (
            <span className="flex items-center gap-1"><CalendarDays size={14}/> Coleccionista desde {joinYear}</span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="px-6 py-3 glass rounded-2xl text-center">
            <p className="text-xl font-bold font-display text-brand-blue">{sets.length}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-black/50">Sets</p>
          </div>
          <div className="px-6 py-3 glass rounded-2xl text-center">
            <p className="text-xl font-bold font-display text-brand-yellow">{totalPieces.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-black/50">Piezas</p>
          </div>
          <div className="px-6 py-3 glass rounded-2xl text-center">
            <p className="text-xl font-bold font-display text-brand-red">{(profile.total_bricks_recibidos || 0).toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-black/50">Bricks (Likes)</p>
          </div>
        </div>

        {sets.length > 0 && (
          <button
            onClick={() => setIsTourActive(true)}
            className="px-8 py-4 rounded-full bg-foreground text-background font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Play size={18} className="fill-background" /> Iniciar Visita Guiada
          </button>
        )}
      </section>

      {/* Grid */}
      <section className="mt-8">
        <h2 className="text-2xl font-display font-bold mb-6 text-center">Colección Pública</h2>

        {sets.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center flex flex-col items-center max-w-lg mx-auto">
            <PackageOpen size={48} className="text-black/20 dark:text-white/20 mb-4" />
            <h3 className="text-xl font-bold mb-2">Sin sets públicos</h3>
            <p className="text-black/60 dark:text-white/60">Este coleccionista no tiene ninguna vitrina pública todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sets.map((set, index) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/set/${set.id}`} className="group flex flex-col gap-4">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 shadow-sm">
                    {set.fotos?.[0]?.url ? (
                      <img
                        src={set.fotos[0].url}
                        alt={set.nombre}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/20 dark:text-white/20">
                        <PackageOpen size={40} />
                      </div>
                    )}
                    {set.tematica && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm text-xs font-semibold shadow-sm text-black">
                        {set.tematica}
                      </div>
                    )}
                  </div>
                  <div className="px-1">
                    <h3 className="font-display font-bold text-lg leading-tight group-hover:text-brand-blue transition-colors mb-2">
                      {set.nombre}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
                      <span className="font-mono text-xs">{(set.num_piezas || 0).toLocaleString()} pz</span>
                      <span className="flex items-center gap-1 text-brand-red font-semibold">
                        <Heart size={14} className="fill-brand-red/20"/> {set.bricks_recibidos || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
