"use client";
import { MOCK_SETS } from "@/lib/data";
import { Box, Calendar, Grid, Tag, ChevronLeft, Heart, Eye } from "lucide-react";
import Link from "next/link";
import * as motion from "framer-motion/client";
import { use, useState } from "react";

export default function SetDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const set = MOCK_SETS.find(s => s.id === resolvedParams.id) || MOCK_SETS[0];

  const [hasLiked, setHasLiked] = useState(false);
  const [localBricks, setLocalBricks] = useState(set.bricks);

  const handleBrick = () => {
    if (hasLiked) {
      setLocalBricks(localBricks - 1);
      setHasLiked(false);
    } else {
      setLocalBricks(localBricks + 1);
      setHasLiked(true);
    }
  };

  return (
    <div className="flex flex-col pb-20">
      <div className="w-full h-[50vh] min-h-[400px] relative bg-black/5 dark:bg-white/5">
        <img src={set.image} alt={set.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        
        <Link href="/" className="absolute top-6 left-4 sm:left-8 w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform text-foreground shadow-lg">
          <ChevronLeft size={24} />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full -mt-20 relative z-10 flex flex-col gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 sm:p-10 rounded-[2.5rem] shadow-xl flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm tracking-wide">
                {set.theme}
              </span>
              <span className="font-mono text-black/50 dark:text-white/50 font-semibold">#{set.id}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-2">
              {set.name}
            </h1>
            <p className="text-black/60 dark:text-white/60 font-medium flex items-center gap-4">
              <span className="flex items-center gap-1"><Grid size={16}/> {set.pieces.toLocaleString()} piezas</span>
              <span className="flex items-center gap-1"><Calendar size={16}/> Alta en 2024</span>
              <span className="flex items-center gap-1"><Eye size={16}/> {set.views.toLocaleString()} vistas</span>
            </p>
          </div>

          <button 
            onClick={handleBrick}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-md active:scale-95 ${
              hasLiked ? 'bg-brand-red text-white' : 'bg-white dark:bg-black text-brand-red hover:bg-brand-red/10'
            }`}
          >
            <Heart size={24} className={hasLiked ? "fill-white" : ""} />
            <span className="text-xl">{localBricks.toLocaleString()} Bricks</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-6">
            <h2 className="text-2xl font-display font-bold">Historia de esta vitrina</h2>
            <p className="text-lg leading-relaxed text-black/70 dark:text-white/70">
              Esta es una descripción de ejemplo. El coleccionista anónimo puede usar este espacio para contar cómo consiguió el set, anécdotas de su montaje o modificaciones personales (MOCs) que le haya añadido.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="glass p-6 rounded-3xl flex flex-col gap-4">
              <p className="text-xs uppercase tracking-wider font-bold text-black/50">Expuesto por</p>
              <Link href="/perfil/anon_84f9" className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow to-brand-blue flex items-center justify-center text-white font-bold font-display shadow-sm group-hover:scale-105 transition-transform">
                  M
                </div>
                <div>
                  <p className="font-bold group-hover:text-brand-blue transition-colors">MasterBuilder_84</p>
                  <p className="text-xs text-black/50 font-mono">anon_84f9</p>
                </div>
              </Link>
            </div>
            
            <div className="glass p-6 rounded-3xl flex flex-col gap-4">
              <p className="text-xs uppercase tracking-wider font-bold text-black/50">Estado</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                  <Box size={20} />
                </div>
                <p className="font-bold">Nuevo en Caja (MISB)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}