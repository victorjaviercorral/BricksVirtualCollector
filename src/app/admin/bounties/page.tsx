"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Target, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminBounties() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [nombreSet, setNombreSet] = useState("");
  const [tematica, setTematica] = useState("");
  const [recompensa, setRecompensa] = useState(5000);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    const { data } = await supabase
      .from("bounties")
      .select("*")
      .order("creado_en", { ascending: false });
    
    if (data) setBounties(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error: insertError } = await supabase
      .from("bounties")
      .insert({
        nombre_set: nombreSet,
        tematica,
        recompensa,
        estado: 'pendiente'
      });

    if (insertError) {
      toast.error("Error al crear el Bounty");
      console.error(insertError);
    } else {
      toast.success("Bounty creado correctamente");
      setShowModal(false);
      setNombreSet("");
      setTematica("");
      setRecompensa(5000);
      fetchBounties();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Seguro que quieres eliminar este Bounty?")) return;
    
    const { error } = await supabase
      .from("bounties")
      .delete()
      .eq("id", id);
      
    if (!error) {
      toast.success("Bounty eliminado");
      fetchBounties();
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">Cargando bounties...</div>;

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl">Gestión de Bounties</h1>
          <p className="text-foreground/70 font-bold mt-1">Lanza misiones para que la comunidad documente sets específicos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all"
        >
          <Plus size={20} /> Nuevo Bounty
        </button>
      </div>

      <div className="grid gap-4">
        {bounties.map((bounty) => (
          <motion.div 
            key={bounty.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] ${bounty.estado === 'completado' ? 'opacity-70 bg-foreground/5' : ''}`}
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-display font-bold text-xl">{bounty.nombre_set}</h3>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border-2 border-foreground ${bounty.estado === 'pendiente' ? 'bg-brand-yellow text-black' : 'bg-brand-green text-white'}`}>
                  {bounty.estado}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground/70">Temática: {bounty.tematica}</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-mono font-black text-brand-red text-xl">+{bounty.recompensa} pts</div>
              </div>
              
              <button onClick={() => handleDelete(bounty.id)} className="w-10 h-10 rounded-xl bg-panel border-2 border-foreground flex items-center justify-center text-brand-red hover:bg-brand-red hover:text-white transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}

        {bounties.length === 0 && (
          <div className="text-center py-20 font-bold text-foreground/50 bg-panel border-2 border-dashed border-foreground rounded-3xl">
            No hay Bounties creados.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-panel border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] rounded-3xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b-2 border-foreground bg-brand-yellow">
              <h3 className="font-display font-black text-2xl text-black">Nuevo Bounty</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-black mb-2">Nombre del Set Buscado</label>
                <input required type="text" value={nombreSet} onChange={e => setNombreSet(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border-2 border-foreground outline-none font-medium" placeholder="Ej. Halcón Milenario UCS" />
              </div>
              <div>
                <label className="block text-sm font-black mb-2">Temática (Tag)</label>
                <input required type="text" value={tematica} onChange={e => setTematica(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border-2 border-foreground outline-none font-medium" placeholder="Ej. Star Wars" />
              </div>
              <div>
                <label className="block text-sm font-black mb-2">Recompensa (Bricks)</label>
                <input required type="number" min="100" step="100" value={recompensa} onChange={e => setRecompensa(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-background border-2 border-foreground outline-none font-mono font-black text-xl text-brand-red" />
              </div>
              
              <div className="mt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-panel border-2 border-foreground font-black hover:bg-black/5">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-brand-blue text-white border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] font-black disabled:opacity-50 transition-all">
                  {saving ? "Creando..." : "Lanzar Bounty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
