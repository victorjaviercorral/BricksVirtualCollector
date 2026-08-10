"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Timer, Trophy, Target, Heart, Plus, Shield, ArrowRight, LayoutGrid, Users, Image as ImageIcon } from "lucide-react";

export default function HubClient({ 
  userProfile, 
  exposicionesActivas, 
  bountiesActivos, 
  setDestacado,
  comunidadSets,
  ultimaInsignia
}: { 
  userProfile: any, 
  exposicionesActivas: any[], 
  bountiesActivos: any[], 
  setDestacado: any,
  comunidadSets: any[],
  ultimaInsignia: any
}) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  const activeExpo = exposicionesActivas[0];
  const upcomingExpo = exposicionesActivas.length > 1 ? exposicionesActivas[1] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Build of the Day / Destacado (Hero) */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden shadow-md bg-foreground h-64 md:h-80"
      >
        <div className="absolute inset-0 w-full h-full bg-[#1a202c] flex items-center justify-center">
          <ImageIcon className="w-24 h-24 text-white/5" />
        </div>
        {setDestacado?.fotos?.[0]?.url && (
          <img 
            src={setDestacado.fotos[0].url} 
            alt="Build of the day" 
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        
        <div className="relative h-full flex flex-col justify-center p-6 md:p-12 w-full md:w-2/3">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Set Destacado</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-white mb-2 leading-tight">
            {setDestacado?.nombre || "Explora el Museo"}
          </h1>
          <p className="text-base md:text-lg text-white/80 mb-6">
            Construido por <span className="font-bold text-brand-yellow">@{setDestacado?.usuarios_perfil?.username || 'Coleccionista'}</span>
          </p>
          {setDestacado && (
            <Link 
              href={`/vitrina/${setDestacado.vitrina_id}`}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 w-fit transition-transform hover:scale-105 shadow-lg"
            >
              <Heart size={18} /> Dar Bricks
            </Link>
          )}
        </div>
      </motion.section>

      {/* BENTO GRID */}
      <motion.section 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6"
      >
        {/* 1. Exposiciones Activas (Red, Tall) */}
        <motion.div variants={item} className="bg-brand-red rounded-2xl p-5 text-white shadow-md flex flex-col col-span-1 md:col-span-1 md:row-span-2 group overflow-hidden relative">
          <div className="relative z-10 mb-4">
            <h2 className="font-display font-bold text-xl mb-1 flex items-center gap-2">
              <Trophy size={20} /> Evento Activo
            </h2>
            {activeExpo ? (
              <p className="text-xs opacity-90 font-mono">¡Participa ahora!</p>
            ) : (
              <p className="text-xs opacity-90">Próximamente...</p>
            )}
          </div>
          
          <Link href={activeExpo ? `/exposicion/${activeExpo.id}` : '#'} className="flex-grow relative rounded-xl overflow-hidden bg-black/20 block hover:ring-2 hover:ring-white/50 transition-all">
            {activeExpo?.imagen_url ? (
              <img src={activeExpo.imagen_url} alt={activeExpo.titulo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10"><ImageIcon className="w-12 h-12 text-white/20" /></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-4">
              <p className="text-[10px] font-bold text-brand-yellow uppercase tracking-wider mb-1">
                {activeExpo?.es_continua ? 'EXPO CONTINUA' : 'TIEMPO LIMITADO'}
              </p>
              <h3 className="font-bold text-lg leading-tight mb-2">{activeExpo?.titulo || 'Sin exposición activa'}</h3>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 hover:bg-white/30 transition-colors">
                Ver detalles <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* 2. Total Bricks (Blue, Square) */}
        <motion.div variants={item} className="bg-brand-blue rounded-2xl p-6 text-white shadow-md flex flex-col items-center justify-center col-span-1 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-white/10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
            <Heart size={120} className="fill-current" />
          </div>
          <h2 className="font-semibold text-sm mb-2 self-start opacity-90 relative z-10">Bricks Recibidos</h2>
          <div className="flex-grow flex flex-col items-center justify-center relative z-10">
            <Heart size={32} className="mb-3 text-brand-yellow fill-brand-yellow drop-shadow-md" />
            <span className="text-4xl md:text-5xl font-black font-display tracking-tight drop-shadow-md">
              {userProfile?.total_bricks_recibidos || 0}
            </span>
          </div>
        </motion.div>

        {/* 3. Latest Badge (Yellow, Square) */}
        <motion.div variants={item} className="bg-brand-yellow rounded-2xl p-6 text-foreground shadow-md flex flex-col items-center justify-center col-span-1 relative overflow-hidden group">
          <Link href="/dashboard/insignias" className="absolute inset-0 z-20" aria-label="Ver insignias" />
          <h2 className="font-semibold text-sm mb-2 self-start opacity-80 relative z-10">Última Insignia</h2>
          <div className="flex-grow flex flex-col items-center justify-center relative z-10">
            <Shield size={48} className="mb-3 text-brand-red fill-current drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-center leading-tight">
              {ultimaInsignia ? ultimaInsignia.titulo_insignia : '¡Participa para ganar!'}
            </span>
            {ultimaInsignia?.exposiciones_temporales?.titulo && (
              <span className="text-[10px] text-foreground/60 mt-1 text-center font-medium">
                Por: {ultimaInsignia.exposiciones_temporales.titulo}
              </span>
            )}
          </div>
        </motion.div>

        {/* 4. Upcoming Events / Otro Evento (Purple, spans 2 cols, short) */}
        <motion.div variants={item} className="bg-brand-purple rounded-2xl p-5 text-white shadow-md flex flex-col col-span-1 md:col-span-1 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12">
            <Timer size={100} />
          </div>
          <h2 className="font-display font-bold text-xl mb-3 relative z-10">Más Eventos</h2>
          <div className="flex-grow flex flex-col justify-end relative z-10">
            {upcomingExpo ? (
              <Link href={`/exposicion/${upcomingExpo.id}`} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl backdrop-blur-sm transition-colors border border-white/10">
                <h3 className="font-bold text-sm leading-tight mb-1">{upcomingExpo.titulo}</h3>
                <p className="text-[10px] opacity-80 flex items-center gap-1"><Timer size={10} /> {upcomingExpo.es_continua ? 'Continua' : 'Abierta'}</p>
              </Link>
            ) : (
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <h3 className="font-bold text-sm leading-tight opacity-70">Pronto más eventos</h3>
              </div>
            )}
          </div>
        </motion.div>

        {/* 5. Comunidad Reciente (Green, spans 2 cols) */}
        <motion.div variants={item} className="bg-brand-green rounded-2xl p-5 text-white shadow-md col-span-1 md:col-span-2 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-5 opacity-20">
            <Users size={60} />
          </div>
          <div className="mb-4 relative z-10 flex justify-between items-end">
            <div>
              <h2 className="font-display font-bold text-xl">Comunidad</h2>
              <p className="text-sm opacity-90">Últimos sets subidos globalmente.</p>
            </div>
            <Link href="/dashboard/vitrinas" className="hidden sm:flex text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg items-center gap-1 transition-colors">
              <Plus size={14} /> Subir el tuyo
            </Link>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden flex-grow border border-white/10">
            <ul className="divide-y divide-white/10">
              {comunidadSets.length > 0 ? (
                comunidadSets.map((set, i) => (
                  <li key={set.id} className="p-3 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/20 relative">
                      {set.fotos?.[0]?.url && <img src={set.fotos[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-bold text-brand-yellow">@{set.usuarios_perfil?.username || 'Anónimo'}</span> añadió
                      </p>
                      <p className="text-xs opacity-80 font-medium truncate">{set.nombre}</p>
                    </div>
                    <Link href={`/vitrina/${set.vitrina_id}`} className="shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30">
                      <ArrowRight size={14} />
                    </Link>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-sm opacity-70">Aún no hay actividad.</li>
              )}
            </ul>
          </div>
        </motion.div>

        {/* 6. Mis Vitrinas (Dark Red / Alternative Red) */}
        <motion.div variants={item} className="bg-[#B32419] rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col col-span-1 group">
          <Link href="/dashboard/vitrinas" className="absolute inset-0 z-20" aria-label="Mis Vitrinas" />
          <h2 className="font-display font-black text-2xl mb-2 relative z-10 leading-none group-hover:text-brand-yellow transition-colors mt-2">
            Mis<br/>Vitrinas
          </h2>
          <div className="absolute -bottom-6 -right-6 opacity-30 w-32 h-32 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
            <LayoutGrid size={120} className="text-white" />
          </div>
          <div className="mt-auto relative z-10">
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-full group-hover:bg-black/30 transition-colors">
              Gestionar <ArrowRight size={12} />
            </span>
          </div>
        </motion.div>

        {/* 7. Community Challenges / Bounties (Teal) */}
        <motion.div variants={item} className="bg-brand-teal rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col col-span-1 group">
          <Link href="/dashboard/participaciones" className="absolute inset-0 z-20" aria-label="Bounties" />
          <h2 className="font-display font-black text-2xl mb-2 relative z-10 leading-none group-hover:text-brand-yellow transition-colors mt-2">
            Se Busca<br/>(Bounties)
          </h2>
          <div className="absolute -bottom-6 -right-6 opacity-30 w-32 h-32 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
            <Target size={120} className="text-white" />
          </div>
          <div className="mt-auto relative z-10">
            {bountiesActivos.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-full group-hover:bg-black/30 transition-colors">
                {bountiesActivos.length} Retos activos <ArrowRight size={12} />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-black/20 px-3 py-1.5 rounded-full">
                Sin retos ahora
              </span>
            )}
          </div>
        </motion.div>

      </motion.section>
    </div>
  );
}
