"use client";

import { Box, Calendar, Grid, Tag, ChevronLeft, Heart, PackageOpen } from "lucide-react";
import Link from "next/link";
import * as motion from "framer-motion/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SetDetailData {
  id: string;
  nombre: string;
  tematica: string | null;
  num_piezas: number | null;
  estado: string | null;
  bricks_recibidos: number | null;
  creado_en: string | null;
  fotos: { url: string }[] | null;
  // Sin tipos generados de Supabase (bloqueado por A1, ver docs/06-decisiones/ADR-010), el
  // cliente infiere las relaciones foráneas como array salvo que se declaren explícitamente.
  // En runtime esta relación (sets.usuario_id -> usuarios_perfil.id) es siempre un único objeto.
  usuarios_perfil: { id: string; alias: string | null; username: string | null } | { id: string; alias: string | null; username: string | null }[] | null;
}

export default function SetDetailClient({
  set,
  isLoggedIn,
  yaVotado,
}: {
  set: SetDetailData;
  isLoggedIn: boolean;
  yaVotado: boolean;
}) {
  const router = useRouter();
  const [hasLiked, setHasLiked] = useState(yaVotado);
  const [localBricks, setLocalBricks] = useState(set.bricks_recibidos || 0);
  const [submitting, setSubmitting] = useState(false);

  const owner = Array.isArray(set.usuarios_perfil) ? set.usuarios_perfil[0] : set.usuarios_perfil;
  const ownerName = owner?.alias || owner?.username || "Coleccionista anónimo";
  const foto = set.fotos?.[0]?.url;
  const altaAnio = set.creado_en ? new Date(set.creado_en).getFullYear() : null;

  const handleBrick = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (hasLiked || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bricks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ set_id: set.id }),
      });

      if (res.ok) {
        setHasLiked(true);
        setLocalBricks((prev) => prev + 1);
        toast.success("¡Brick enviado!");
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || "No se pudo enviar el Brick");
      }
    } catch {
      toast.error("Error de conexión al enviar el Brick");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col pb-20">
      <div className="w-full h-[50vh] min-h-[400px] relative bg-black/5 dark:bg-white/5">
        {foto ? (
          <img src={foto} alt={set.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/20 dark:text-white/20">
            <PackageOpen size={64} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        <Link href="/" className="absolute top-6 left-4 sm:left-8 w-12 h-12 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform text-foreground shadow-lg">
          <ChevronLeft size={24} />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full -mt-20 relative z-10 flex flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 sm:p-10 rounded-[2.5rem] shadow-xl flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              {set.tematica && (
                <span className="px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm tracking-wide">
                  {set.tematica}
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-tight mb-2">
              {set.nombre}
            </h1>
            <p className="text-black/60 dark:text-white/60 font-medium flex items-center gap-4">
              {set.num_piezas ? (
                <span className="flex items-center gap-1"><Grid size={16}/> {set.num_piezas.toLocaleString()} piezas</span>
              ) : null}
              {altaAnio && (
                <span className="flex items-center gap-1"><Calendar size={16}/> Alta en {altaAnio}</span>
              )}
            </p>
          </div>

          <button
            onClick={handleBrick}
            disabled={hasLiked || submitting}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all shadow-md active:scale-95 disabled:cursor-default ${
              hasLiked ? 'bg-brand-red text-white' : 'bg-white dark:bg-black text-brand-red hover:bg-brand-red/10'
            }`}
          >
            <Heart size={24} className={hasLiked ? "fill-white" : ""} />
            <span className="text-xl">{localBricks.toLocaleString()} Bricks</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-6">
            <h2 className="text-2xl font-display font-bold">Sobre este set</h2>
            <p className="text-lg leading-relaxed text-black/70 dark:text-white/70">
              Este set forma parte de la colección pública de {ownerName}.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass p-6 rounded-3xl flex flex-col gap-4">
              <p className="text-xs uppercase tracking-wider font-bold text-black/50">Expuesto por</p>
              <Link href={owner ? `/perfil/${owner.id}` : "#"} className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-yellow to-brand-blue flex items-center justify-center text-white font-bold font-display shadow-sm group-hover:scale-105 transition-transform">
                  {ownerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold group-hover:text-brand-blue transition-colors">{ownerName}</p>
                </div>
              </Link>
            </div>

            {set.estado && (
              <div className="glass p-6 rounded-3xl flex flex-col gap-4">
                <p className="text-xs uppercase tracking-wider font-bold text-black/50">Estado</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <Box size={20} />
                  </div>
                  <p className="font-bold">{set.estado}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
