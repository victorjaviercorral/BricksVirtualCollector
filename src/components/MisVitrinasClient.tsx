"use client";

import { useState } from "react";
import { Plus, Eye, Globe, Lock, Link as LinkIcon, Package } from "lucide-react";
import Link from "next/link";
import { CrearVitrinaModal } from "./CrearVitrinaModal";

interface MisVitrinasClientProps {
  vitrinas: any[];
}

export function MisVitrinasClient({ vitrinas }: MisVitrinasClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Header Section */}
      <div className="mb-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-none tracking-tight">Mis Vitrinas</h1>
        <div className="flex flex-wrap gap-4">
          <button
            data-tour="crear-vitrina"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={18} />
            Crear Vitrina
          </button>
          <Link 
            href="/mesa-de-trabajo"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={18} />
            Añadir Set
          </Link>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
        
        {/* Empty State Card - Always visible at the end or when empty */}
        {vitrinas.length === 0 && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-2xl border-2 border-dashed border-black/20 dark:border-white/20 p-6 flex flex-col items-center justify-center text-center h-full min-h-[360px] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4"
          >
            <div className="w-14 h-14 rounded-full bg-panel shadow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground leading-tight mb-2">
              Tu Próxima Gran<br/>Colección
            </h3>
            <p className="text-sm text-black/60 dark:text-white/60 max-w-[200px]">
              Empieza a construir y compartir tus sets favoritos aquí.
            </p>
          </button>
        )}

        {/* Vitrinas Cards */}
        {vitrinas.map((vitrina, i) => {
          // Obtener la imagen del primer set
          const imageSrc = vitrina.sets && vitrina.sets[0]?.fotos?.[0]?.url;

          return (
            <Link
              key={vitrina.id}
              href={`/dashboard/vitrina/${vitrina.id}`}
              className="bg-panel rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 group"
            >
              <div className="rounded-xl overflow-hidden mb-4 aspect-[4/3] bg-black/5 dark:bg-white/5 relative">
                {imageSrc ? (
                  <img src={imageSrc} alt={vitrina.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-black/20 dark:text-white/20">
                    <Package size={40} className="mb-2" />
                    <span className="font-bold text-sm">Vacía</span>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <Eye size={24} />
                  </div>
                </div>
              </div>
              
              <div className="flex-grow">
                <h2 className="text-xl font-display font-bold leading-tight mb-3 text-foreground line-clamp-2">
                  {vitrina.nombre}
                </h2>
                <div className="flex items-center gap-2 text-black/60 dark:text-white/60 mb-1">
                  <Package size={16} />
                  <span className="font-bold text-sm">{(vitrina.sets || []).length} sets</span>
                </div>
                {/* Opcional: Si hubiera un conteo de piezas total se podría mostrar aquí, usamos Font Mono */}
                <div className="text-[10px] text-black/40 dark:text-white/40 font-mono mb-4 pl-6 uppercase tracking-wider">
                  Inventario
                </div>
              </div>
              
              <div className="mt-auto pt-2" {...(i === 0 ? { "data-tour": "vitrina-visibilidad" } : {})}>
                {vitrina.visibilidad === 'pública' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-blue/10 text-brand-blue">
                    <Globe size={12} />
                    Pública
                  </span>
                )}
                {vitrina.visibilidad === 'privada' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-black/5 text-black/70 dark:bg-white/10 dark:text-white/70">
                    <Lock size={12} />
                    Privada
                  </span>
                )}
                {vitrina.visibilidad === 'con_enlace' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-purple/10 text-brand-purple">
                    <LinkIcon size={12} />
                    Solo Enlace
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        
        {/* Add new vitrina card when there are already vitrinas */}
        {vitrinas.length > 0 && (
           <button 
             onClick={() => setIsModalOpen(true)}
             className="rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center text-center h-full min-h-[360px] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
           >
             <div className="w-12 h-12 rounded-full bg-panel border border-black/10 dark:border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Plus size={20} className="text-foreground" />
             </div>
             <h3 className="font-bold text-foreground">Crear otra vitrina</h3>
           </button>
        )}
      </div>

      <CrearVitrinaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
