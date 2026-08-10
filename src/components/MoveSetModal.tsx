"use client";

import { useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MoveSetModal({ set, vitrinas }: { set: any, vitrinas: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVitrinaId, setSelectedVitrinaId] = useState(set.vitrina_id);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedVitrinaId === set.vitrina_id) {
      toast.error("Selecciona una vitrina diferente");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('sets')
      .update({ vitrina_id: selectedVitrinaId })
      .eq('id', set.id);

    setLoading(false);

    if (error) {
      toast.error("Error al mover el set");
      return;
    }

    toast.success("Set movido correctamente");
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(true); }}
        className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:scale-110 transition-transform shadow-md" 
        title="Mover a otra vitrina"
      >
        <ArrowRightLeft size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-black/5 dark:border-white/5 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
              <h3 className="font-display font-bold text-xl">Mover Set</h3>
              <button onClick={() => setIsOpen(false)} aria-label="Cerrar" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleMove} className="p-6 flex flex-col gap-6">
              <p className="text-black/60 dark:text-white/60">
                ¿A qué vitrina quieres mover el set <strong>{set.nombre}</strong>?
              </p>

              <div>
                <label id="move-set-vitrina-label" className="block text-sm font-bold mb-3">Vitrina de destino</label>
                <div role="group" aria-labelledby="move-set-vitrina-label" className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                  {vitrinas.map(vitrina => (
                    <button
                      key={vitrina.id}
                      type="button"
                      onClick={() => setSelectedVitrinaId(vitrina.id)}
                      className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${selectedVitrinaId === vitrina.id ? 'border-brand-blue bg-brand-blue/5 shadow-sm' : 'border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30'}`}
                    >
                      <div>
                        <strong className="block mb-1">{vitrina.nombre}</strong>
                        <span className="text-xs text-black/50 dark:text-white/50">{vitrina.visibilidad}</span>
                      </div>
                      {set.vitrina_id === vitrina.id && (
                         <span className="text-xs font-bold bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full">Vitrina actual</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading || selectedVitrinaId === set.vitrina_id}
                  className="flex-1 py-3 rounded-xl font-bold bg-brand-blue text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Moviendo..." : "Mover Set"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
