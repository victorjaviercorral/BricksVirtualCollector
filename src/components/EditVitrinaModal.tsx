"use client";

import { useState } from "react";
import { X, Edit3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditVitrinaModal({ vitrina }: { vitrina: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState(vitrina.nombre);
  const [descripcion, setDescripcion] = useState(vitrina.descripcion || "");
  const [visibilidad, setVisibilidad] = useState(vitrina.visibilidad);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('vitrinas')
      .update({ nombre, descripcion, visibilidad })
      .eq('id', vitrina.id);

    setLoading(false);

    if (error) {
      toast.error("Error al actualizar la vitrina");
      return;
    }

    toast.success("Vitrina actualizada correctamente");
    setIsOpen(false);
    router.refresh(); // Refresh server component data
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
      >
        <Edit3 size={18} /> Editar Vitrina
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-black/5 dark:border-white/5 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
              <h3 className="font-display font-bold text-xl">Editar Vitrina</h3>
              <button onClick={() => setIsOpen(false)} aria-label="Cerrar" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
              <div>
                <label htmlFor="edit-vitrina-nombre" className="block text-sm font-bold mb-2">Nombre de la Vitrina *</label>
                <input
                  id="edit-vitrina-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="edit-vitrina-descripcion" className="block text-sm font-bold mb-2">Descripción (Opcional)</label>
                <textarea
                  id="edit-vitrina-descripcion"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-blue transition-colors resize-none h-24"
                  placeholder="¿De qué trata esta colección?"
                />
              </div>

              <div>
                <label id="edit-vitrina-visibilidad-label" className="block text-sm font-bold mb-2">Visibilidad</label>
                <div role="group" aria-labelledby="edit-vitrina-visibilidad-label" className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setVisibilidad("privada")}
                    className={`p-4 rounded-xl border text-left transition-all ${visibilidad === 'privada' ? 'border-brand-blue bg-brand-blue/5' : 'border-black/10 dark:border-white/10 opacity-60'}`}
                  >
                    <strong className="block mb-1">Privada</strong>
                    <span className="text-xs">Solo tú puedes verla</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilidad("pública")}
                    className={`p-4 rounded-xl border text-left transition-all ${visibilidad === 'pública' ? 'border-brand-blue bg-brand-blue/5' : 'border-black/10 dark:border-white/10 opacity-60'}`}
                  >
                    <strong className="block mb-1">Pública</strong>
                    <span className="text-xs">Visible en el museo y perfil</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold bg-brand-blue text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
