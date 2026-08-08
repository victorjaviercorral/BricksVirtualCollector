"use client";

import { useState } from "react";
import { Plus, Settings, LogOut, Grid, Eye, Heart, Medal, X, Map } from "lucide-react";
import * as motion from "framer-motion/client";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardClient({ userProfile, vitrinas }: { userProfile: any, vitrinas: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [visibilidad, setVisibilidad] = useState("privada");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreateVitrina = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase.from('vitrinas').insert({
      usuario_id: userData.user.id,
      nombre,
      descripcion,
      visibilidad,
      estado: 'publicada' // Changed from 'borrador' so it appears in the public museum immediately
    }).select().single();

    setLoading(false);

    if (error) {
      alert("Error al crear vitrina: " + error.message);
      return;
    }

    if (data) {
      setIsModalOpen(false);
      router.push(`/dashboard/vitrina/${data.id}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col gap-10 pb-20">
      
      {/* Header Profile & Analytics */}
      <section className="flex flex-col gap-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/perfil" className="group/avatar relative block">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-red flex items-center justify-center text-white text-2xl font-display font-bold shadow-md uppercase overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform" />
                ) : (
                  userProfile?.username?.charAt(0) || "U"
                )}
              </div>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                {userProfile?.alias || userProfile?.username || "Usuario Anonimo"}
                {/* Badges mockup */}
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full bg-brand-yellow text-white flex items-center justify-center shadow-sm" title="Fundador">
                    <Medal size={12} />
                  </div>
                </div>
              </h1>
              <p className="text-black/50 dark:text-white/50 font-mono text-sm flex items-center gap-2">
                Identidad Protegida
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/perfil" className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/70 dark:text-white/70" title="Editar Perfil">
              <Settings size={20} />
            </Link>
            <button onClick={handleLogout} className="p-3 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="glass p-6 rounded-3xl border-l-4 border-l-brand-blue">
            <p className="text-xs font-bold uppercase tracking-wider text-black/50 flex items-center gap-2 mb-2"><Grid size={14}/> Vitrinas</p>
            <p className="text-3xl font-display font-extrabold">{vitrinas.length}</p>
          </motion.div>
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} className="glass p-6 rounded-3xl border-l-4 border-l-brand-yellow">
            <p className="text-xs font-bold uppercase tracking-wider text-black/50 flex items-center gap-2 mb-2"><Eye size={14}/> Visitas Totales</p>
            <p className="text-3xl font-display font-extrabold">{userProfile?.total_visitas || 0}</p>
          </motion.div>
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.15}} className="glass p-6 rounded-3xl border-l-4 border-l-brand-red">
            <p className="text-xs font-bold uppercase tracking-wider text-black/50 flex items-center gap-2 mb-2"><Heart size={14}/> Bricks Totales</p>
            <p className="text-3xl font-display font-extrabold">{userProfile?.total_bricks_recibidos || 0}</p>
          </motion.div>
        </div>

        {/* Quick Actions (Piedra angular) */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button 
             onClick={() => setIsModalOpen(true)}
             className="flex-1 py-5 rounded-3xl font-display font-bold text-lg bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center"><Plus size={20} /></div>
            Crear Vitrina
          </button>
          <Link 
             href="/mesa-de-trabajo"
             className="flex-1 py-5 rounded-3xl font-display font-bold text-lg bg-brand-blue text-white shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Plus size={20} /></div>
            Añadir Set
          </Link>
        </div>
      </section>

      {/* Grid of Vitrinas */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-display font-bold">Mis Vitrinas</h2>
        </div>
        
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-2 p-1 glass rounded-full text-sm w-max">
            <button 
              onClick={() => setViewMode("grid")}
              className={`px-4 py-1.5 rounded-full font-semibold flex items-center gap-2 transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-black shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            >
              <Grid size={16} /> Grid
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 rounded-full font-semibold transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-black shadow-sm' : 'opacity-50 hover:opacity-100'}`}
            >
              Lista
            </button>
          </div>
        </div>
        
        {vitrinas.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
            {vitrinas.map((vitrina, i) => (
              <div key={vitrina.id} className={`glass rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group ${viewMode === 'list' ? 'flex items-center h-28' : 'flex flex-col'}`}>
                <Link href={`/dashboard/vitrina/${vitrina.id}`} className={`${viewMode === 'list' ? 'h-full aspect-square w-28 shrink-0' : 'aspect-[4/3]'} bg-black/5 dark:bg-white/5 relative overflow-hidden flex items-center justify-center`}>
                  {vitrina.sets && vitrina.sets[0]?.fotos?.[0]?.url ? (
                    <img src={vitrina.sets[0].fotos[0].url} alt={vitrina.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-black/30 dark:text-white/30">
                      <Grid size={48} className="mb-2" />
                      <span className="font-bold text-sm">Vacía</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Eye size={24} />
                    </div>
                  </div>
                </Link>
                <div className={`p-4 flex-1 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                  <div>
                    <p className="font-bold leading-tight truncate mb-1">{vitrina.nombre}</p>
                    <p className={`text-xs text-black/50 font-mono ${viewMode === 'grid' ? 'mb-4' : ''}`}>{(vitrina.sets || []).length} Sets</p>
                  </div>
                  <div className={`${viewMode === 'grid' ? 'p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between -mx-4 -mb-4 bg-black/5 dark:bg-white/5' : 'flex items-center gap-4'}`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-black/60">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${vitrina.visibilidad === 'pública' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60'}`}>
                        {vitrina.visibilidad}
                      </span>
                    </div>
                    <Link href={`/dashboard/vitrina/${vitrina.id}`} className={`font-bold text-xs text-brand-blue hover:underline ${viewMode === 'list' ? 'bg-brand-blue/10 px-4 py-2 rounded-full' : ''}`}>
                      Gestionar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-3xl border border-dashed border-black/10 dark:border-white/10">
             <Map size={48} className="mx-auto text-black/20 dark:text-white/20 mb-4" />
             <h3 className="text-xl font-bold mb-2">Tu museo está vacío</h3>
             <p className="text-black/60 dark:text-white/60 mb-6 max-w-sm mx-auto">Crea tu primera vitrina para empezar a clasificar y subir las fotos de tus sets de forma privada y segura.</p>
             <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform">
               <Plus size={20} /> Crear Vitrina
             </button>
          </div>
        )}
      </section>

      {/* Modal Crear Vitrina */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/5"
          >
            <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
              <h2 className="text-xl font-display font-bold">Nueva Vitrina</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateVitrina} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold mb-2">Nombre de la Vitrina</label>
                <input 
                  required
                  type="text" 
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Star Wars UCS, Ciudad, Harry Potter..."
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none focus:ring-2 focus:ring-brand-blue/50 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Descripción (Opcional)</label>
                <textarea 
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Pequeña historia sobre esta vitrina..."
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 outline-none focus:ring-2 focus:ring-brand-blue/50 font-medium resize-none h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Privacidad</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setVisibilidad("privada")}
                    className={`px-4 py-3 rounded-xl font-bold border-2 transition-colors ${visibilidad === 'privada' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-transparent bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10'}`}
                  >
                    Privada
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVisibilidad("pública")}
                    className={`px-4 py-3 rounded-xl font-bold border-2 transition-colors ${visibilidad === 'pública' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-transparent bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:bg-black/10'}`}
                  >
                    Pública
                  </button>
                </div>
                <p className="text-xs text-black/50 dark:text-white/50 mt-2 font-medium">
                  {visibilidad === 'privada' 
                    ? "Solo tú podrás ver esta vitrina y sus sets. Perfecto para inventario personal." 
                    : "La vitrina será visible en el museo público. Los datos sensibles seguirán ocultos."}
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-full font-bold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-full bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creando..." : "Crear Vitrina"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
