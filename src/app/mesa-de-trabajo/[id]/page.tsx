"use client";
import { UploadCloud, ShieldAlert, ImagePlus, Hash, Tag, Package, Info, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import * as motion from "framer-motion/client";
import Link from "next/link";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { MOCK_SETS } from "@/lib/data";

export default function EditarMesaTrabajo({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // En una app real haríamos fetch. Aquí pillamos el mock o fallback.
  const set = MOCK_SETS.find(s => s.id === resolvedParams.id) || MOCK_SETS[0];

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  const handleDelete = () => {
    if(confirm("¿Estás seguro de que quieres borrar esta vitrina permanentemente?")) {
      setIsDeleting(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Editar Vitrina</h1>
          <p className="text-black/60 dark:text-white/60">Actualiza los datos de tu set o elimínalo de tu colección.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 text-brand-green font-medium rounded-full text-sm">
          <ShieldAlert size={16} /> Metadatos (EXIF) protegidos
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photos */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="aspect-[4/3] lg:aspect-[4/5] w-full rounded-3xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden relative group">
            <img src={set.image} alt={set.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <p className="text-white font-bold flex items-center gap-2"><UploadCloud size={20}/> Cambiar Foto</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-2xl border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center text-black/30 hover:bg-black/5 cursor-pointer transition-colors">
                <ImagePlus size={24} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Número de Set</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                  <input type="text" defaultValue={set.id} className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Temática</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                  <select defaultValue={set.theme} className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none">
                    <option>Star Wars</option>
                    <option>Icons</option>
                    <option>Architecture</option>
                    <option>Ideas</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Nombre del Set</label>
              <input type="text" defaultValue={set.name} className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Estado de conservación</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                <select defaultValue="Montado" className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none">
                  <option>Nuevo en Caja (MISB)</option>
                  <option>Montado</option>
                  <option>Desmontado en bolsas</option>
                  <option>Incompleto</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1 flex items-center justify-between">
                Notas Privadas o Públicas
                <span className="text-brand-blue text-[10px] bg-brand-blue/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Info size={12}/> Opcional</span>
              </label>
              <textarea 
                rows={4}
                defaultValue="Conseguido en el mercado secundario. Le falta una pieza del motor."
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <button 
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="w-full sm:w-auto px-6 py-3 font-bold text-brand-red border border-brand-red/20 bg-brand-red/5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-red hover:text-white transition-colors"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {isDeleting ? "Borrando..." : "Borrar Vitrina"}
            </button>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              <Link href="/dashboard" className="px-6 py-3 font-medium text-black/60 hover:text-black">
                Cancelar
              </Link>
              <button 
                onClick={handleUpdate}
                disabled={isSubmitting || isDeleting}
                className="px-8 py-3 rounded-full bg-brand-blue text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}