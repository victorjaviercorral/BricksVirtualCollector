"use client";

import { useState } from "react";
import { X, Lock, Globe, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import * as motion from "framer-motion/client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CrearVitrinaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CrearVitrinaModal({ isOpen, onClose }: CrearVitrinaModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [visibilidad, setVisibilidad] = useState<"privada" | "pública" | "con_enlace">("pública");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase.from('vitrinas').insert({
      usuario_id: userData.user.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      visibilidad,
      estado: 'publicada' // Se asume publicada para que pueda tener visibilidad
    }).select().single();

    setLoading(false);

    if (error) {
      toast.error("Error al crear vitrina: " + error.message);
      return;
    }

    if (data) {
      toast.success("Vitrina creada correctamente");
      onClose();
      router.push(`/dashboard/vitrina/${data.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
        className="bg-panel w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <h2 id="modal-title" className="text-2xl font-display font-bold">Nueva Vitrina</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/50 dark:text-white/50"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleCreate} className="p-6 flex flex-col gap-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-bold mb-2">Nombre de la Vitrina</label>
            <input 
              id="nombre"
              required
              type="text" 
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Star Wars UCS, Ciudad, Harry Potter..."
              className="w-full px-4 py-3 rounded-lg border border-black/20 dark:border-white/20 bg-transparent outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium"
            />
          </div>
          
          <div>
            <label htmlFor="descripcion" className="block text-sm font-bold mb-2">Descripción (Opcional)</label>
            <textarea 
              id="descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Pequeña historia sobre esta vitrina..."
              className="w-full px-4 py-3 rounded-lg border border-black/20 dark:border-white/20 bg-transparent outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium resize-none h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Privacidad</label>
            <p className="text-xs text-black/60 dark:text-white/60 mb-3">Selector el fin de visibilidad de privacidad.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opción Privada */}
              <button 
                type="button"
                onClick={() => setVisibilidad("privada")}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  visibilidad === 'privada' 
                    ? 'border-brand-blue bg-brand-blue text-white' 
                    : 'border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {visibilidad === 'privada' && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-white" />}
                <Lock size={24} className="mb-2" />
                <span className="font-bold text-sm">Privada</span>
              </button>
              
              {/* Opción Pública */}
              <button 
                type="button"
                onClick={() => setVisibilidad("pública")}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  visibilidad === 'pública' 
                    ? 'border-brand-blue bg-brand-blue text-white' 
                    : 'border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {visibilidad === 'pública' && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-white" />}
                <Globe size={24} className="mb-2" />
                <span className="font-bold text-sm">Pública</span>
              </button>

              {/* Opción Con Enlace */}
              <button 
                type="button"
                onClick={() => setVisibilidad("con_enlace")}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  visibilidad === 'con_enlace' 
                    ? 'border-brand-blue bg-brand-blue text-white' 
                    : 'border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {visibilidad === 'con_enlace' && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-white" />}
                <LinkIcon size={24} className="mb-2" />
                <span className="font-bold text-sm text-center leading-tight">Con Enlace</span>
              </button>
            </div>
            
            <p className="text-xs text-black/60 dark:text-white/60 mt-4">
              {visibilidad === 'privada' && "Solo tú podrás ver esta vitrina y sus sets. Perfecto para inventario personal."}
              {visibilidad === 'pública' && "La vitrina será visible en el museo para todos. Ideal para exhibir tu colección."}
              {visibilidad === 'con_enlace' && "Solo tú y las personas con el enlace podrán ver esta vitrina y sus sets. Perfecto para compartir en privado."}
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-bold border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Vitrina"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
