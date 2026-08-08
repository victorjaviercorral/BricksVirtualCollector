"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Box, Heart, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function VitrinaClient({ id }: { id: string }) {
  const supabase = createClient();
  const [vitrina, setVitrina] = useState<any>(null);
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [givenBricks, setGivenBricks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      // 1. Load Vitrina
      const { data: vData, error: vError } = await supabase
        .from("vitrinas")
        .select(`
          *,
          usuarios_perfil(username)
        `)
        .eq("id", id)
        .single();

      if (vError || !vData) {
        setLoading(false);
        return;
      }
      setVitrina(vData);

      // 2. Load Sets
      const { data: sData, error: sError } = await supabase
        .from("sets")
        .select(`
          *,
          fotos(url, orden),
          bricks_recibidos(count)
        `)
        .eq("vitrina_id", id)
        .order("creado_en", { ascending: false });

      if (sData) {
        setSets(sData.map(s => ({
          ...s,
          bricks_count: s.bricks_recibidos?.[0]?.count || 0
        })));
      }
      
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleGiveBrick = async (setId: string) => {
    if (givenBricks[setId]) return;

    // Optimistic UI
    setGivenBricks(prev => ({ ...prev, [setId]: true }));
    setSets(prev => prev.map(s => 
      s.id === setId ? { ...s, bricks_count: (s.bricks_count || 0) + 1 } : s
    ));

    try {
      const res = await fetch("/api/bricks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set_id: setId })
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Error al dar Brick");
      }
    } catch (err: any) {
      toast.error(err.message);
      // Revert Optimistic UI
      setGivenBricks(prev => ({ ...prev, [setId]: false }));
      setSets(prev => prev.map(s => 
        s.id === setId ? { ...s, bricks_count: (s.bricks_count || 1) - 1 } : s
      ));
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-brand-blue border-t-transparent animate-spin" /></div>;
  }

  if (!vitrina) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
        <AlertCircle size={48} className="text-brand-red opacity-50" />
        <h1 className="text-3xl font-display font-bold">Vitrina no encontrada</h1>
        <p className="text-black/60 dark:text-white/60 max-w-md">
          Es posible que esta vitrina sea privada, haya sido eliminada o el enlace sea incorrecto.
        </p>
        <Link href="/" className="mt-4 px-6 py-3 rounded-xl bg-brand-blue text-white font-bold hover:scale-105 transition-transform">
          Volver al Museo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-4xl font-display font-extrabold">{vitrina.nombre}</h1>
          <p className="text-black/60 dark:text-white/60">
            Colección de <strong className="text-brand-blue">{vitrina.usuarios_perfil?.username || "Anónimo"}</strong>
          </p>
        </div>
      </div>

      <p className="text-lg max-w-2xl text-black/80 dark:text-white/80">{vitrina.descripcion}</p>

      {sets.length === 0 ? (
        <div className="p-10 glass rounded-3xl text-center flex flex-col items-center gap-4">
          <Box size={40} className="text-black/20 dark:text-white/20" />
          <p className="font-bold text-xl">Esta vitrina aún no tiene sets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {sets.map(set => (
            <div key={set.id} className="glass rounded-[2rem] p-4 flex flex-col gap-4 group">
              <div className="aspect-square bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden relative">
                {set.fotos?.[0] ? (
                  <img src={set.fotos[0].url} alt={set.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/20 dark:text-white/20">
                    <Box size={40} />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {set.num_piezas} pzs
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-xl leading-tight mb-1">{set.nombre}</h3>
                <p className="text-sm font-medium text-brand-blue uppercase tracking-wider">{set.tematica}</p>
              </div>
              <div className="mt-auto pt-2 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => handleGiveBrick(set.id)}
                  disabled={givenBricks[set.id]}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                    givenBricks[set.id] 
                      ? "bg-brand-red text-white scale-105 shadow-md shadow-brand-red/20" 
                      : "bg-black/5 dark:bg-white/5 hover:bg-brand-red/10 hover:text-brand-red text-black/60 dark:text-white/60"
                  }`}
                >
                  <Heart size={18} className={givenBricks[set.id] ? "fill-white" : ""} />
                  {set.bricks_count || 0} Bricks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
