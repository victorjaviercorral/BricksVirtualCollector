"use client";

import { ShieldAlert, Hash, Tag, Package, Info, CheckCircle2, Loader2, Trash2, PackageOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EditarSetData {
  id: string;
  nombre: string;
  tematica: string | null;
  num_piezas: number | null;
  estado: string | null;
  num_set: string | null;
  notas: string | null;
  vitrina_id: string;
  fotos: { url: string }[] | null;
}

export default function EditarSetClient({ set }: { set: EditarSetData }) {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [numSet, setNumSet] = useState(set.num_set || "");
  const [tematica, setTematica] = useState(set.tematica || "Star Wars");
  const [nombre, setNombre] = useState(set.nombre);
  const [estado, setEstado] = useState(set.estado || "Montado");
  const [notas, setNotas] = useState(set.notas || "");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from("sets")
      .update({
        nombre,
        tematica,
        estado,
        num_set: numSet || null,
        notas: notas || null,
      })
      .eq("id", set.id);

    setIsSubmitting(false);

    if (error) {
      toast.error("Error al guardar los cambios");
      return;
    }

    toast.success("Set actualizado correctamente");
    router.push(`/dashboard/vitrina/${set.vitrina_id}`);
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres borrar este set permanentemente?")) return;

    setIsDeleting(true);
    const { error } = await supabase.from("sets").delete().eq("id", set.id);
    setIsDeleting(false);

    if (error) {
      toast.error("Error al borrar el set");
      return;
    }

    toast.success("Set eliminado");
    router.push(`/dashboard/vitrina/${set.vitrina_id}`);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Editar Set</h1>
          <p className="text-black/60 dark:text-white/60">Actualiza los datos de tu set o elimínalo de tu colección.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 text-brand-green font-medium rounded-full text-sm">
          <ShieldAlert size={16} /> Metadatos (EXIF) protegidos
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Photo (solo lectura -- la gestión de fotos vive en Mesa de Trabajo al crear el set) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="aspect-[4/3] lg:aspect-[4/5] w-full rounded-3xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden relative">
            {set.fotos?.[0]?.url ? (
              <img src={set.fotos[0].url} alt={set.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/20 dark:text-white/20">
                <PackageOpen size={48} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Form */}
        <form onSubmit={handleUpdate} className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass p-6 sm:p-8 rounded-3xl flex flex-col gap-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="mesa-set-numero" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Número de Set</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                  <input
                    id="mesa-set-numero"
                    type="text"
                    value={numSet}
                    onChange={(e) => setNumSet(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="mesa-set-tematica" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Temática</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                  <select
                    id="mesa-set-tematica"
                    value={tematica}
                    onChange={(e) => setTematica(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none"
                  >
                    <option>Star Wars</option>
                    <option>Icons</option>
                    <option>Architecture</option>
                    <option>Ideas</option>
                    <option>Technic</option>
                    <option>City</option>
                    <option>Creator</option>
                    <option>Harry Potter</option>
                    <option>Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-set-nombre" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Nombre del Set</label>
              <input
                id="mesa-set-nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-set-estado" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Estado de conservación</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
                <select
                  id="mesa-set-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 appearance-none"
                >
                  <option>Nuevo en Caja (MISB)</option>
                  <option>Montado</option>
                  <option>Desmontado en bolsas</option>
                  <option>Incompleto</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="mesa-set-notas" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1 flex items-center justify-between">
                Notas Privadas o Públicas
                <span className="text-brand-blue text-[10px] bg-brand-blue/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Info size={12}/> Opcional</span>
              </label>
              <textarea
                id="mesa-set-notas"
                rows={4}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/50 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="w-full sm:w-auto px-6 py-3 font-bold text-brand-red border border-brand-red/20 bg-brand-red/5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-red hover:text-white transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {isDeleting ? "Borrando..." : "Borrar Set"}
            </button>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              <Link href={`/dashboard/vitrina/${set.vitrina_id}`} className="px-6 py-3 font-medium text-black/60 hover:text-black">
                Cancelar
              </Link>
              <button
                type="submit"
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
        </form>
      </div>
    </div>
  );
}
