import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft, Grid, Eye, Trash2, Edit3, Image as ImageIcon } from "lucide-react";
import EditVitrinaModal from "@/components/EditVitrinaModal";
import MoveSetModal from "@/components/MoveSetModal";

export default async function GestionVitrina(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtener detalles de la vitrina
  const { data: vitrina, error } = await supabase
    .from('vitrinas')
    .select(`
      *,
      sets (
        *,
        fotos (
          url
        )
      )
    `)
    .eq('id', params.id)
    .eq('usuario_id', user.id)
    .single();

  // Obtener TODAS las vitrinas del usuario para el modal de mover
  const { data: todasVitrinas } = await supabase
    .from('vitrinas')
    .select('id, nombre, visibilidad')
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: false });

  if (error || !vitrina) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Vitrina no encontrada</h2>
        <p className="text-red-500 mb-4">{error ? error.message + " - " + error.details + " - " + error.hint : "Vitrina not found in DB."}</p>
        <Link href="/dashboard" className="text-brand-blue font-bold hover:underline">Volver al Dashboard</Link>
      </div>
    );
  }

  const sets = vitrina.sets || [];

  return (
    <div className="flex flex-col gap-10 pb-20">
      
      {/* Breadcrumb & Header */}
      <section className="flex flex-col gap-4 mt-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors w-max font-bold text-sm">
          <ArrowLeft size={16} /> Volver al Dashboard
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-extrabold mb-2">{vitrina.nombre}</h1>
            {vitrina.descripcion && (
              <p className="text-black/60 dark:text-white/60 max-w-xl text-lg mb-4">{vitrina.descripcion}</p>
            )}
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${vitrina.visibilidad === 'pública' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60'}`}>
                {vitrina.visibilidad}
              </span>
              <span className="text-sm font-mono text-black/50 dark:text-white/50">{sets.length} Sets</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <EditVitrinaModal vitrina={vitrina} />
          </div>
        </div>
      </section>

      {/* Grid de Sets */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Grid className="text-brand-yellow" /> Sets en esta Vitrina
          </h2>
          <Link href={`/mesa-de-trabajo?vitrina_id=${vitrina.id}`} className="px-5 py-2.5 rounded-full bg-brand-blue text-white font-bold hover:scale-105 transition-transform flex items-center gap-2">
            <Plus size={18} /> Añadir Set
          </Link>
        </div>
        
        {sets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set: any) => (
              <div key={set.id} className="glass rounded-3xl overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-black/5 dark:bg-white/5 relative overflow-hidden flex items-center justify-center">
                  {set.fotos && set.fotos.length > 0 ? (
                    <img src={set.fotos[0].url} alt={set.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="text-black/30 dark:text-white/30 flex flex-col items-center">
                      <ImageIcon size={48} className="mb-2" />
                      <span className="font-bold text-sm">Sin fotos</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Link href={`/mesa-de-trabajo?set_id=${set.id}`} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform" title="Editar">
                      <Edit3 size={20} />
                    </Link>
                    <MoveSetModal set={set} vitrinas={todasVitrinas || []} />
                    <button className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center hover:scale-110 transition-transform shadow-md" title="Eliminar">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-bold text-lg leading-tight truncate mb-1">{set.nombre}</p>
                  <p className="text-xs text-black/50 font-mono mb-4">{set.num_piezas} piezas • {set.tematica}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-3xl border border-dashed border-black/10 dark:border-white/10">
             <div className="w-20 h-20 mx-auto bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
               <Grid size={32} className="text-black/40 dark:text-white/40" />
             </div>
             <h3 className="text-xl font-bold mb-2">Esta vitrina está vacía</h3>
             <p className="text-black/60 dark:text-white/60 mb-6 max-w-sm mx-auto">Comienza a subir las fotos de tus sets y a catalogarlos uno por uno.</p>
             <Link href={`/mesa-de-trabajo?vitrina_id=${vitrina.id}`} className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg">
               <Plus size={20} /> Añadir el Primer Set
             </Link>
          </div>
        )}
      </section>

    </div>
  );
}
