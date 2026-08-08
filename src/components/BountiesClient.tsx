"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Target, ArrowLeft, PlusCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BountiesClient() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadBounties() {
      const { data, error } = await supabase
        .from("bounties")
        .select("*")
        .order("creado_en", { ascending: false });
        
      if (!error && data) {
        setBounties(data);
      }
      setLoading(false);
    }
    loadBounties();
  }, []);

  const handleReclamar = (nombre: string, tematica: string) => {
    // Redirigir a Mesa de Trabajo con prefill via query params
    const params = new URLSearchParams();
    params.set("nombre_set", nombre);
    params.set("tematica", tematica);
    router.push(`/mesa-de-trabajo?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-brand-blue font-bold mb-6 hover:underline">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center">
              <Target size={32} />
            </div>
            Bounties Comunitarios
          </h1>
          <p className="text-xl text-black/60 dark:text-white/60 mt-4 max-w-2xl">
            La comunidad está buscando estos sets. Sé el primero en publicarlos en una vitrina pública para reclamar la recompensa en Bricks.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 rounded-full border-4 border-brand-red border-t-transparent animate-spin" />
        </div>
      ) : bounties.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center flex flex-col items-center gap-4">
          <CheckCircle2 size={48} className="text-brand-green opacity-50" />
          <h2 className="text-2xl font-bold">¡Todo limpio!</h2>
          <p className="text-black/60 dark:text-white/60 max-w-md">
            No hay bounties activos en este momento. La comunidad está satisfecha, pero vuelve pronto porque los administradores publican nuevos retos a menudo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.map((bounty) => (
            <div key={bounty.id} className="glass rounded-[2rem] p-6 flex flex-col gap-6 relative overflow-hidden group border border-brand-red/10">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-red/5 rounded-full group-hover:bg-brand-red/10 transition-colors" />
              
              <div>
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-sm font-bold mb-4">
                  Recompensa: {bounty.recompensa} Bricks
                </div>
                <h3 className="text-2xl font-display font-bold leading-tight mb-2">{bounty.nombre_set}</h3>
                <p className="text-sm font-medium text-black/50 dark:text-white/50 uppercase tracking-widest">{bounty.tematica}</p>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => handleReclamar(bounty.nombre_set, bounty.tematica)}
                  disabled={bounty.estado === "reclamado"}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform ${
                    bounty.estado === "reclamado" 
                      ? "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 cursor-not-allowed"
                      : "bg-brand-red text-white hover:scale-105 shadow-md shadow-brand-red/20"
                  }`}
                >
                  {bounty.estado === "reclamado" ? "Ya reclamado" : <><PlusCircle size={18} /> Aportar Set</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
