"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Map, Plus, Trash2, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminExposiciones() {
  const [exposiciones, setExposiciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [requisitos, setRequisitos] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [esContinua, setEsContinua] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchExposiciones();
  }, []);

  const fetchExposiciones = async () => {
    const { data } = await supabase
      .from("exposiciones_temporales")
      .select("*")
      .order("creado_en", { ascending: false });
    
    if (data) setExposiciones(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Selecciona una imagen de portada");
      return;
    }
    
    if (!esContinua && (!fechaInicio || !fechaFin)) {
      toast.error("Debes definir las fechas o marcarla como continua");
      return;
    }

    setSaving(true);
    
    // 1. Subir imagen
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('exposiciones')
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Error al subir la imagen");
      setSaving(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('exposiciones')
      .getPublicUrl(filePath);

    // 2. Desactivar anteriores
    await supabase.from("exposiciones_temporales").update({ estado: 'archivada' }).neq('id', '00000000-0000-0000-0000-000000000000'); 

    const { error: insertError } = await supabase
      .from("exposiciones_temporales")
      .insert({
        titulo,
        descripcion,
        requisitos,
        imagen_url: publicUrl,
        estado: 'activa',
        es_continua: esContinua,
        fecha_inicio: esContinua ? null : new Date(fechaInicio).toISOString(),
        fecha_fin: esContinua ? null : new Date(fechaFin).toISOString()
      });

    if (insertError) {
      toast.error("Error al crear la exposición");
      console.error(insertError);
    } else {
      toast.success("Exposición publicada correctamente");
      setShowModal(false);
      setTitulo("");
      setDescripcion("");
      setRequisitos("");
      setFechaInicio("");
      setFechaFin("");
      setEsContinua(false);
      setFile(null);
      fetchExposiciones();
    }
    setSaving(false);
  };

  const handleArchive = async (id: string) => {
    // TODO: Aquí deberemos calcular y repartir las insignias
    const { error } = await supabase
      .from("exposiciones_temporales")
      .update({ estado: 'archivada' })
      .eq("id", id);
      
    if (!error) fetchExposiciones();
  };

  const handleActivate = async (id: string) => {
    await supabase.from("exposiciones_temporales").update({ estado: 'archivada' }).neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase
      .from("exposiciones_temporales")
      .update({ estado: 'activa' })
      .eq("id", id);
      
    if (!error) fetchExposiciones();
  };

  if (loading) return <div className="p-20 text-center font-bold">Cargando exposiciones...</div>;

  return (
    <div className="py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl">Gestión de Exposiciones</h1>
          <p className="text-foreground/70 font-bold mt-1">Crea y modera eventos temporales para la comunidad.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all"
        >
          <Plus size={20} /> Crear Evento
        </button>
      </div>

      <div className="grid gap-6">
        {exposiciones.map((expo) => (
          <motion.div 
            key={expo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] ${expo.estado === 'activa' ? 'ring-4 ring-brand-yellow/50' : 'opacity-70'}`}
          >
            <div className="w-full md:w-64 h-40 rounded-xl border-2 border-foreground overflow-hidden flex-shrink-0 relative">
              <img src={expo.imagen_url} alt="Portada" className="w-full h-full object-cover" />
              {expo.estado === 'activa' && (
                <div className="absolute top-2 left-2 bg-brand-yellow text-black text-xs font-black px-2 py-1 rounded border-2 border-black">ACTIVA</div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-2xl">{expo.titulo}</h3>
                <p className="text-sm font-medium text-foreground/80 mt-2 mb-4 line-clamp-2">{expo.descripcion}</p>
                
                <div className="flex flex-wrap gap-4 mb-4 text-sm font-bold text-foreground/70">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} /> 
                    {expo.es_continua ? 'Exposición Continua' : `${new Date(expo.fecha_inicio).toLocaleDateString()} - ${new Date(expo.fecha_fin).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                {expo.estado === 'activa' ? (
                  <button onClick={() => handleArchive(expo.id)} className="text-sm font-bold bg-brand-red text-white px-4 py-2 rounded-xl border-2 border-foreground shadow-[2px_2px_0px_0px_#0F172A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all">Finalizar y Entregar Insignias</button>
                ) : (
                  <button onClick={() => handleActivate(expo.id)} className="text-sm font-bold bg-panel px-4 py-2 rounded-xl border-2 border-foreground hover:bg-black/5 transition-colors">Reactivar</button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {exposiciones.length === 0 && (
          <div className="text-center py-20 font-bold text-foreground/50 bg-panel border-2 border-dashed border-foreground rounded-3xl">
            No hay exposiciones creadas.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-panel border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] rounded-3xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-6 border-b-2 border-foreground bg-brand-yellow">
              <h3 className="font-display font-black text-2xl text-black">Nuevo Evento</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label htmlFor="titulo" className="block text-sm font-black mb-2">Título de la Campaña</label>
                <input id="titulo" required type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border-2 border-foreground outline-none focus:ring-2 focus:ring-brand-blue font-medium" placeholder="Ej. Star Wars Week" />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-black mb-2">Descripción Corta</label>
                <textarea id="descripcion" required value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-background border-2 border-foreground outline-none focus:ring-2 focus:ring-brand-blue resize-none h-20 font-medium" />
              </div>
              <div>
                <label htmlFor="requisitos" className="block text-sm font-black mb-2">Requisitos de Participación (Normas)</label>
                <textarea id="requisitos" required value={requisitos} onChange={e => setRequisitos(e.target.value)} placeholder="Ej. Solo naves de la trilogía original. Mínimo 3 fotos." className="w-full px-4 py-3 rounded-xl bg-background border-2 border-foreground outline-none focus:ring-2 focus:ring-brand-blue resize-none h-24 font-medium" />
              </div>
              
              <div className="border-2 border-foreground rounded-xl p-4 bg-background">
                 <label htmlFor="continua" className="flex items-center gap-3 cursor-pointer">
                    <input id="continua" type="checkbox" checked={esContinua} onChange={e => setEsContinua(e.target.checked)} className="w-5 h-5 accent-brand-blue" />
                    <span className="font-black text-sm">Exposición Continua (Sin fecha de fin)</span>
                 </label>
                 
                 {!esContinua && (
                   <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-foreground/20">
                     <div>
                       <label htmlFor="fecha-inicio" className="block text-xs font-bold mb-1">Fecha de Inicio</label>
                       <input id="fecha-inicio" required type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full p-2 border-2 border-foreground rounded-lg bg-panel" />
                     </div>
                     <div>
                       <label htmlFor="fecha-fin" className="block text-xs font-bold mb-1">Fecha de Fin</label>
                       <input id="fecha-fin" required type="datetime-local" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full p-2 border-2 border-foreground rounded-lg bg-panel" />
                     </div>
                   </div>
                 )}
              </div>

              <div>
                <label htmlFor="portada" className="block text-sm font-black mb-2">Imagen de Portada (Banner)</label>
                <input id="portada" required type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border-2 border-foreground p-2 rounded-xl bg-background" />
              </div>
              
              <div className="mt-2 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-panel border-2 border-foreground font-black hover:bg-black/5">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-brand-blue text-white border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] font-black disabled:opacity-50 transition-all">
                  {saving ? "Publicando..." : "Crear Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
