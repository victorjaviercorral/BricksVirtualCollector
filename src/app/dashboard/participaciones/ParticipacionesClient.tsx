"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Target, Sparkles, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ParticipacionesClient({ 
  misExposiciones, 
  misBounties, 
  misInsignias,
  exposActivas,
  bountiesActivos 
}: { 
  misExposiciones: any[], 
  misBounties: any[], 
  misInsignias: any[],
  exposActivas: any[],
  bountiesActivos: any[]
}) {
  const [activeTab, setActiveTab] = useState("exposiciones");
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleWithdraw = async (id: string) => {
    if (!confirm("¿Seguro que quieres retirar este set de la exposición?")) return;
    setIsWithdrawing(id);
    
    const { error } = await supabase
      .from("exposicion_sets")
      .delete()
      .eq("id", id);
      
    if (error) {
      toast.error("Error al retirar la participación");
    } else {
      toast.success("Participación retirada con éxito");
      router.refresh();
    }
    setIsWithdrawing(null);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-10">
      <header>
        <h1 className="font-display font-black text-4xl mb-2">Mi Historial Gamificado</h1>
        <p className="text-foreground/70 font-bold">Gestiona tus participaciones, medallas y recompensas.</p>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-brand-blue/10 border-2 border-brand-blue rounded-2xl p-6 flex flex-col items-center justify-center text-center">
           <Trophy size={32} className="text-brand-blue mb-2" />
           <div className="text-3xl font-black text-brand-blue">{misInsignias.length}</div>
           <div className="font-bold text-sm text-brand-blue/70 uppercase tracking-widest">Insignias</div>
        </div>
        <div className="bg-brand-yellow/10 border-2 border-brand-yellow rounded-2xl p-6 flex flex-col items-center justify-center text-center">
           <Sparkles size={32} className="text-brand-yellow mb-2" />
           <div className="text-3xl font-black text-brand-yellow">{misExposiciones.length}</div>
           <div className="font-bold text-sm text-brand-yellow/70 uppercase tracking-widest">Eventos</div>
        </div>
        <div className="bg-brand-red/10 border-2 border-brand-red rounded-2xl p-6 flex flex-col items-center justify-center text-center">
           <Target size={32} className="text-brand-red mb-2" />
           <div className="text-3xl font-black text-brand-red">{misBounties.length}</div>
           <div className="font-bold text-sm text-brand-red/70 uppercase tracking-widest">Bounties</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b-2 border-foreground/10 pb-4 overflow-x-auto no-scrollbar">
        {['exposiciones', 'bounties', 'insignias'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-bold text-sm capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-foreground text-background shadow-md' : 'bg-panel border-2 border-foreground hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'exposiciones' && (
          <div className="space-y-6">
            {misExposiciones.map(expo => (
              <div key={expo.id} className="bg-panel rounded-2xl border-2 border-foreground p-6 shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-48 h-32 rounded-xl border-2 border-foreground overflow-hidden shrink-0">
                  <img src={expo.exposiciones_temporales?.imagen_url} alt="Expo" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display font-black text-xl">{expo.exposiciones_temporales?.titulo}</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border-2 border-foreground ${expo.estado === 'aprobado' ? 'bg-brand-green text-white' : expo.estado === 'pendiente' ? 'bg-brand-yellow text-black' : 'bg-brand-red text-white'}`}>
                        {expo.estado}
                      </span>
                    </div>
                    <p className="font-bold text-foreground/70">Participas con: <Link href={`/set/${expo.sets?.id}`} className="text-brand-blue hover:underline">{expo.sets?.nombre}</Link></p>
                  </div>
                  
                  {expo.exposiciones_temporales?.estado === 'activa' && (
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => handleWithdraw(expo.id)}
                        disabled={isWithdrawing === expo.id}
                        className="text-sm font-bold flex items-center gap-2 text-brand-red hover:bg-brand-red/10 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} /> Retirar Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {misExposiciones.length === 0 && (
              <div className="text-center py-12 font-bold text-foreground/50 border-2 border-dashed border-foreground/20 rounded-2xl">
                Aún no has participado en ninguna exposición.
              </div>
            )}
          </div>
        )}

        {activeTab === 'bounties' && (
          <div className="grid gap-4">
            {misBounties.map(b => (
              <div key={b.id} className="bg-panel rounded-2xl border-2 border-foreground p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg">{b.nombre_set}</h4>
                  <p className="text-sm text-foreground/70 font-medium">Reclamado el {new Date(b.creado_en).toLocaleDateString()}</p>
                </div>
                <div className="font-mono font-black text-brand-red text-xl">
                  +{b.recompensa} pts
                </div>
              </div>
            ))}
            {misBounties.length === 0 && (
              <div className="text-center py-12 font-bold text-foreground/50 border-2 border-dashed border-foreground/20 rounded-2xl">
                No has reclamado ningún bounty todavía.
              </div>
            )}
          </div>
        )}

        {activeTab === 'insignias' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {misInsignias.map(badge => (
              <div key={badge.id} className="bg-panel rounded-2xl border-2 border-foreground p-6 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] group hover:-translate-y-1 transition-transform">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-4 shadow-inner ${badge.rango === 1 ? 'bg-[#FFD700] border-[#B8860B] text-black' : badge.rango === 2 ? 'bg-[#C0C0C0] border-[#808080] text-black' : 'bg-[#CD7F32] border-[#8B4513] text-white'}`}>
                  <Trophy size={40} />
                </div>
                <h4 className="font-black text-sm uppercase leading-tight mb-2">{badge.titulo_insignia}</h4>
                <p className="text-[10px] font-bold text-foreground/50">{badge.exposiciones_temporales?.titulo}</p>
              </div>
            ))}
            {misInsignias.length === 0 && (
              <div className="col-span-full text-center py-12 font-bold text-foreground/50 border-2 border-dashed border-foreground/20 rounded-2xl">
                Aún no tienes insignias. ¡Participa en exposiciones para conseguirlas!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="mt-16 bg-gradient-to-br from-brand-blue/20 to-brand-yellow/20 rounded-3xl p-8 border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA]">
        <h2 className="font-display font-black text-2xl mb-6 flex items-center gap-3">
          <Sparkles className="text-brand-blue" /> Descubre más Retos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm mb-4 text-foreground/70">Exposiciones Activas</h3>
            <div className="space-y-4">
              {exposActivas.map(expo => (
                <Link key={expo.id} href={`/exposicion/${expo.id}`} className="block bg-panel p-4 rounded-xl border-2 border-foreground hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all">
                  <p className="font-black text-lg">{expo.titulo}</p>
                  <p className="text-sm font-bold text-foreground/70 mt-1 line-clamp-1">{expo.descripcion}</p>
                </Link>
              ))}
              {exposActivas.length === 0 && <p className="text-sm font-bold text-foreground/50">No hay exposiciones activas en este momento.</p>}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold uppercase tracking-widest text-sm mb-4 text-foreground/70">Bounties Recomendados</h3>
            <div className="space-y-3">
              {bountiesActivos.slice(0, 3).map(bounty => (
                <div key={bounty.id} className="bg-panel p-3 rounded-xl border-2 border-foreground flex justify-between items-center">
                  <span className="font-bold text-sm truncate pr-2">{bounty.nombre_set}</span>
                  <span className="font-mono font-black text-xs text-brand-red bg-brand-red/10 px-2 py-1 rounded">+{bounty.recompensa} pts</span>
                </div>
              ))}
              {bountiesActivos.length > 0 && (
                <Link href="/" className="text-xs font-black uppercase text-brand-blue flex items-center justify-end gap-1 mt-2 hover:underline">
                  Ver todos <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
