"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Info, Plus, ArrowLeft, Trophy, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ExposicionClient({ exposicion, ranking, userSets, userId }: { exposicion: any, ranking: any[], userSets: any[], userId: string | null }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (exposicion.es_continua || !exposicion.fecha_fin) {
      setTimeLeft("Exposición Continua");
      return;
    }

    const updateTimer = () => {
      const end = new Date(exposicion.fecha_fin).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("Finalizada");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [exposicion]);

  const handleParticipate = async () => {
    if (!selectedSet) return;
    setSubmitting(true);
    
    const { error } = await supabase
      .from("exposicion_sets")
      .insert({
        exposicion_id: exposicion.id,
        set_id: selectedSet,
        estado: 'pendiente'
      });

    if (error) {
      toast.error(error.code === '23505' ? 'Este set ya está participando o en revisión' : 'Error al enviar la solicitud');
    } else {
      toast.success("Set enviado a revisión. ¡Mucha suerte!");
      setShowModal(false);
    }
    setSubmitting(false);
  };

  const handleVote = async (setId: string) => {
    // Insert vote with exposicion_id
    const { error } = await supabase
      .from("bricks_recibidos")
      .insert({
        set_id: setId,
        exposicion_id: exposicion.id,
        hash_visitante: `user-${userId}-${Date.now()}` // simple hash for demo
      });

    if (error) {
      toast.error("Error al votar");
    } else {
      toast.success("¡Voto registrado!");
      router.refresh();
    }
  };

  const bgColors = ["bg-brand-blue", "bg-brand-yellow", "bg-brand-red", "bg-brand-green"];

  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <section className="relative w-full h-[50vh] min-h-[400px] border-b-2 border-foreground overflow-hidden">
        <img src={exposicion.imagen_url} alt={exposicion.titulo} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        <div className="absolute top-6 left-6 z-20">
          <Link href="/" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl border-2 border-black font-bold hover:bg-brand-yellow transition-colors shadow-[4px_4px_0px_0px_#000]">
            <ArrowLeft size={20} /> Volver
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="text-white max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-display font-black leading-tight mb-4">{exposicion.titulo}</h1>
            <p className="text-lg md:text-xl font-medium text-white/80">{exposicion.descripcion}</p>
          </div>
          
          <div className="flex flex-col items-end gap-4 shrink-0">
            <div className="bg-brand-yellow text-black px-6 py-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
              <Timer size={24} className={timeLeft !== 'Finalizada' && !exposicion.es_continua ? 'animate-pulse text-brand-red' : ''} />
              <div>
                <div className="text-xs font-black uppercase opacity-80">Tiempo Restante</div>
                <div className="text-xl font-black font-mono">{timeLeft}</div>
              </div>
            </div>
            
            {exposicion.estado === 'activa' && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-brand-blue text-white px-8 py-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all font-black text-xl w-full md:w-auto text-center"
              >
                PARTICIPAR
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Requirements */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-brand-yellow rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-8">
            <div className="flex items-center gap-3 mb-4 text-black">
              <Info size={28} />
              <h3 className="font-display font-black text-2xl">Requisitos</h3>
            </div>
            <div className="text-black font-bold whitespace-pre-wrap leading-relaxed">
              {exposicion.requisitos}
            </div>
          </div>
          
          {exposicion.estado === 'archivada' && (
            <div className="bg-panel rounded-3xl border-2 border-foreground p-8 flex items-center gap-4">
              <Trophy size={40} className="text-brand-yellow shrink-0" />
              <div>
                <h3 className="font-display font-black text-xl">Evento Finalizado</h3>
                <p className="text-sm font-bold text-foreground/70">Las medallas han sido entregadas a los mejores sets.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-black text-4xl">Ranking del Evento</h2>
            <div className="bg-panel px-4 py-2 rounded-xl border-2 border-foreground font-bold text-sm">
              {ranking.length} Participantes
            </div>
          </div>

          <div className="space-y-4">
            {ranking.map((set, index) => (
              <motion.div 
                key={set.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-panel rounded-2xl border-2 border-foreground flex overflow-hidden items-center p-4 gap-6 relative ${index < 3 ? 'shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA]' : 'opacity-90'}`}
              >
                <div className={`w-12 h-12 flex shrink-0 items-center justify-center rounded-xl font-display font-black text-2xl border-2 border-foreground ${index === 0 ? 'bg-brand-yellow text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-[#CD7F32] text-white' : 'bg-background'}`}>
                  #{index + 1}
                </div>
                
                <Link href={`/set/${set.id}`} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-foreground bg-black/5 hover:scale-105 transition-transform">
                  <img src={set.foto_url} alt={set.nombre} className="w-full h-full object-cover" />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/set/${set.id}`} className="font-display font-bold text-xl hover:underline truncate block">
                    {set.nombre}
                  </Link>
                  <p className="font-mono text-sm text-foreground/60 font-bold truncate">@{set.usuarios_perfil?.username}</p>
                </div>
                
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="font-mono font-black text-2xl px-4 py-1 bg-brand-red text-white rounded-lg border-2 border-foreground rotate-2">
                    {set.votos}
                  </div>
                  {exposicion.estado === 'activa' && (
                    <button 
                      onClick={() => handleVote(set.id)}
                      className="text-xs font-black uppercase bg-brand-yellow text-black px-3 py-1 rounded-md border-2 border-foreground hover:scale-110 transition-transform"
                    >
                      +1 Voto
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            
            {ranking.length === 0 && (
              <div className="text-center py-20 bg-panel border-2 border-dashed border-foreground rounded-3xl">
                <p className="font-display font-black text-2xl text-foreground/50">Aún no hay participantes aprobados.</p>
                <p className="font-bold text-foreground/40 mt-2">¡Sé el primero en unirte!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-panel border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] rounded-3xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b-2 border-foreground bg-brand-yellow flex justify-between items-center">
              <h3 className="font-display font-black text-2xl text-black">Unirse a la Exposición</h3>
              <button onClick={() => setShowModal(false)} className="text-black font-black text-xl hover:scale-110 transition-transform">X</button>
            </div>
            
            <div className="p-8">
              <div className="bg-brand-red/10 text-brand-red p-4 rounded-xl font-bold flex gap-3 mb-6 border-2 border-brand-red">
                <AlertTriangle size={24} className="shrink-0" />
                <p>Al participar, un moderador revisará tu Set para comprobar que cumple las normas de la exposición. Si es aprobado, aparecerá en el ranking.</p>
              </div>

              <h4 className="font-display font-bold text-xl mb-4">Selecciona tu Set</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-1">
                {userSets.map(set => (
                  <div 
                    key={set.id}
                    onClick={() => setSelectedSet(set.id)}
                    className={`cursor-pointer rounded-xl border-2 overflow-hidden relative group transition-all ${selectedSet === set.id ? 'border-brand-blue shadow-[4px_4px_0px_0px_#0F172A] scale-105' : 'border-foreground/20 hover:border-foreground'}`}
                  >
                    <div className="aspect-square bg-black/5 relative">
                      <img src={set.fotos?.[0]?.url || ''} alt={set.nombre} className="w-full h-full object-cover" />
                      {selectedSet === set.id && (
                        <div className="absolute inset-0 bg-brand-blue/20 flex items-center justify-center">
                          <CheckCircle2 size={40} className="text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-panel border-t-2 border-foreground/20 font-bold text-xs truncate text-center">
                      {set.nombre}
                    </div>
                  </div>
                ))}
                {userSets.length === 0 && (
                  <div className="col-span-full py-10 text-center font-bold text-foreground/50">
                    No tienes ningún set en tus vitrinas para participar.
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-background border-2 border-foreground font-black hover:bg-black/5">Cancelar</button>
                <button 
                  onClick={handleParticipate} 
                  disabled={submitting || !selectedSet} 
                  className="flex-1 py-3 rounded-xl bg-brand-blue text-white border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] font-black disabled:opacity-50 transition-all"
                >
                  {submitting ? "Enviando..." : "Enviar a Revisión"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
