"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Ghost, CheckCircle2, Clock, Target, Award, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ExposicionParticipacion {
  id: string;
  estado: string;
  exposicion_id: string;
  set_id?: string | null;
  exposiciones_temporales?: {
    titulo?: string;
    estado?: string;
    imagen_url?: string | null;
    fecha_fin?: string | null;
    es_continua?: boolean | null;
  } | null;
  sets?: { id?: string; nombre?: string } | null;
}

interface PosicionVivo {
  posicion: number;
  bricks: number;
  total: number;
}

interface BountyParticipacion {
  id: string;
  nombre_set: string;
  descripcion?: string | null;
  recompensa: number;
}

interface ExposicionRecomendada {
  id: string;
  titulo: string;
  descripcion?: string | null;
  imagen_url?: string | null;
}

interface BountyRecomendado {
  id: string;
  titulo?: string | null;
  nombre_set?: string | null;
  descripcion?: string | null;
  recompensa?: number | null;
}

interface UserProfileSummary {
  avatar_url?: string | null;
}

function tiempoRestante(expo: ExposicionParticipacion["exposiciones_temporales"]): string | null {
  if (!expo) return null;
  if (expo.es_continua || !expo.fecha_fin) return "Exposición continua";
  const distancia = new Date(expo.fecha_fin).getTime() - Date.now();
  if (distancia <= 0) return "Cierre inminente";
  const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
  if (dias >= 1) return `Quedan ${dias} día${dias === 1 ? "" : "s"}`;
  const horas = Math.floor(distancia / (1000 * 60 * 60));
  return `Quedan ${horas} h`;
}

export default function ParticipacionesClient({
  userProfile,
  misExposiciones,
  posiciones,
  misBounties,
  exposRecomendadas,
  bountiesRecomendados,
}: {
  userProfile: UserProfileSummary | null;
  misExposiciones: ExposicionParticipacion[];
  posiciones: Record<string, PosicionVivo | null>;
  misBounties: BountyParticipacion[];
  exposRecomendadas: ExposicionRecomendada[];
  bountiesRecomendados: BountyRecomendado[];
}) {
  const [isWithdrawing, setIsWithdrawing] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleWithdraw = async (id: string) => {
    if (!confirm("¿Seguro que quieres retirar este set de la exposición?")) return;
    setIsWithdrawing(id);

    const { error } = await supabase.from("exposicion_sets").delete().eq("id", id);

    if (error) {
      toast.error("Error al retirar la participación");
    } else {
      toast.success("Participación retirada con éxito");
      router.refresh();
    }
    setIsWithdrawing(null);
  };

  const hayActividad = misExposiciones.length > 0 || misBounties.length > 0;
  const hayRecomendaciones = exposRecomendadas.length > 0 || bountiesRecomendados.length > 0;

  return (
    <div className="py-8 max-w-6xl mx-auto space-y-10">
      {/* Cabecera */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <article className="md:col-span-6 bg-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 neo-brutalism relative overflow-hidden">
          <div className="relative w-24 h-24 rounded-full border-4 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] bg-white flex items-center justify-center overflow-hidden shrink-0">
            {userProfile?.avatar_url ? (
              <img alt="Foto de perfil" className="w-full h-full object-cover" src={userProfile.avatar_url} />
            ) : (
              <UserIcon />
            )}
          </div>
          <div className="flex flex-col justify-center h-full">
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground tracking-tight uppercase leading-none mb-2">
              Mis Participaciones
            </h1>
            <p className="text-foreground/70 font-bold">Lo que tienes en juego ahora mismo</p>
            <Link
              href="/dashboard/insignias"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue hover:gap-2.5 transition-all"
            >
              <Trophy size={16} /> Ver tu Pasaporte de Exposiciones
            </Link>
          </div>
        </article>

        <article
          className="md:col-span-3 bg-panel rounded-2xl p-6 flex items-center gap-4 border-[3px] border-brand-blue relative overflow-hidden"
          style={{ boxShadow: "4px 6px 0px 0px var(--color-brand-blue)" }}
        >
          <div className="w-16 h-16 rounded-full bg-brand-blue border-4 border-foreground flex items-center justify-center text-white shrink-0 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]">
            <span className="font-display font-black text-2xl">E</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-foreground tracking-widest uppercase">Exposiciones</h2>
            <span className="text-4xl font-black text-brand-blue leading-none mt-1">{misExposiciones.length}</span>
          </div>
        </article>

        <article
          className="md:col-span-3 bg-panel rounded-2xl p-6 flex items-center gap-4 border-[3px] border-brand-red relative overflow-hidden"
          style={{ boxShadow: "4px 6px 0px 0px var(--color-brand-red)" }}
        >
          <div className="w-16 h-16 rounded-full bg-brand-red border-4 border-foreground flex items-center justify-center text-white shrink-0 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]">
            <Target size={28} strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-foreground tracking-widest uppercase">Bounties</h2>
            <span className="text-4xl font-black text-brand-red leading-none mt-1">{misBounties.length}</span>
          </div>
        </article>
      </section>

      {!hayActividad && !hayRecomendaciones ? (
        <section className="w-full bg-panel rounded-3xl p-12 md:p-24 flex flex-col items-center justify-center text-center neo-brutalism relative mt-2">
          <div className="w-48 h-48 mb-8 text-foreground/20">
            <Ghost size={192} strokeWidth={1} />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
            ¡Aún no has participado!
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mb-10 font-bold">
            Empieza a construir tu legado. Apúntate a una exposición o reclama tu primer bounty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/exposiciones"
              className="bg-brand-blue text-white font-black py-4 px-8 rounded-full neo-brutalism-sm hover:-translate-y-1 transition-transform text-lg text-center"
            >
              Explorar Exposiciones
            </Link>
            <Link
              href="/bounties"
              className="bg-panel text-foreground border-[3px] border-foreground font-black py-4 px-8 rounded-full neo-brutalism-sm hover:-translate-y-1 transition-transform text-lg text-center"
            >
              Ver Bounties Disponibles
            </Link>
          </div>
        </section>
      ) : (
        <div className="space-y-12">
          {/* Tus exposiciones activas */}
          {misExposiciones.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-black mb-6 text-foreground uppercase tracking-tight">
                Tus exposiciones activas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {misExposiciones.map((expo) => {
                  const pos = posiciones[expo.id];
                  const tiempo = tiempoRestante(expo.exposiciones_temporales);
                  return (
                    <article key={expo.id} className="bg-panel rounded-2xl neo-brutalism p-5 flex flex-col justify-between">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl border-[3px] border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] overflow-hidden shrink-0">
                          <img
                            src={expo.exposiciones_temporales?.imagen_url || "/placeholder-expo.jpg"}
                            alt="Expo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-xl leading-tight mb-1">
                            <Link href={`/exposicion/${expo.exposicion_id}`} className="hover:underline">
                              {expo.exposiciones_temporales?.titulo}
                            </Link>
                          </h3>
                          <p className="text-sm font-bold text-foreground/70">
                            Set:{" "}
                            <Link href={`/set/${expo.sets?.id}`} className="text-brand-blue hover:underline">
                              {expo.sets?.nombre}
                            </Link>
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border-2 border-foreground bg-black/5 dark:bg-white/5 text-xs font-bold uppercase">
                              {expo.estado === "aprobado" ? (
                                <CheckCircle2 size={14} className="text-brand-green" />
                              ) : expo.estado === "rechazado" ? (
                                <Clock size={14} className="text-brand-red" />
                              ) : (
                                <Clock size={14} className="text-brand-yellow" />
                              )}
                              <span
                                className={
                                  expo.estado === "aprobado"
                                    ? "text-brand-green"
                                    : expo.estado === "rechazado"
                                    ? "text-brand-red"
                                    : "text-brand-yellow"
                                }
                              >
                                {expo.estado === "aprobado"
                                  ? "En el ranking"
                                  : expo.estado === "rechazado"
                                  ? "No aprobado"
                                  : "En revisión"}
                              </span>
                            </span>
                            {pos && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded border-2 border-foreground bg-brand-yellow/20 text-xs font-black uppercase">
                                <Award size={14} className="text-brand-yellow" />#{pos.posicion} de {pos.total} · {pos.bricks} bricks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t-[3px] border-foreground/10 flex items-center justify-between">
                        {tiempo && <span className="text-xs font-bold text-foreground/60">{tiempo}</span>}
                        <button
                          onClick={() => handleWithdraw(expo.id)}
                          disabled={isWithdrawing === expo.id}
                          className="text-xs font-black uppercase flex items-center gap-1 text-brand-red hover:underline disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Retirar Set
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Mis bounties en curso */}
          {misBounties.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-black mb-6 text-foreground uppercase tracking-tight">
                Mis Bounties
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {misBounties.map((b) => (
                  <Link key={b.id} href={`/dashboard/participaciones/${b.id}`} className="block">
                    <article className="bg-panel rounded-2xl neo-brutalism p-5 flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform group cursor-pointer">
                      <div>
                        <h3 className="font-black text-foreground mb-2 leading-tight uppercase group-hover:text-brand-blue transition-colors">
                          {b.nombre_set}
                        </h3>
                        <p className="text-sm text-foreground/70 font-bold line-clamp-2">
                          {b.descripcion || "Participación en este reto."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-brand-yellow rounded-full border-2 border-foreground"></div>
                          <span className="font-black text-sm">{b.recompensa} Pts</span>
                        </div>
                        <span className="bg-brand-yellow text-foreground text-[10px] font-black uppercase px-2 py-1 rounded-full border-2 border-foreground flex items-center gap-1">
                          <Clock size={12} strokeWidth={3} />
                          Pendiente
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Dónde puedes participar */}
          {hayRecomendaciones && (
            <section>
              <h2 className="font-display text-2xl font-black mb-6 text-foreground uppercase tracking-tight">
                Dónde puedes participar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exposRecomendadas.map((e) => (
                  <Link key={e.id} href={`/exposicion/${e.id}`} className="block">
                    <article className="bg-panel rounded-2xl neo-brutalism p-5 h-full flex flex-col hover:-translate-y-1 transition-transform group">
                      <span className="text-[10px] font-black uppercase text-brand-blue mb-1">Exposición abierta</span>
                      <h3 className="font-black text-foreground leading-tight uppercase group-hover:text-brand-blue transition-colors">
                        {e.titulo}
                      </h3>
                      <p className="text-sm text-foreground/70 font-bold line-clamp-2 mt-1">{e.descripcion}</p>
                      <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-black uppercase text-brand-blue">
                        Apuntar un set <ArrowRight size={14} />
                      </span>
                    </article>
                  </Link>
                ))}
                {bountiesRecomendados.map((b) => (
                  <Link key={b.id} href="/bounties" className="block">
                    <article className="bg-panel rounded-2xl neo-brutalism p-5 h-full flex flex-col hover:-translate-y-1 transition-transform group">
                      <span className="text-[10px] font-black uppercase text-brand-red mb-1">Bounty abierto</span>
                      <h3 className="font-black text-foreground leading-tight uppercase group-hover:text-brand-red transition-colors">
                        {b.titulo || b.nombre_set || "Reto de la comunidad"}
                      </h3>
                      <p className="text-sm text-foreground/70 font-bold line-clamp-2 mt-1">{b.descripcion}</p>
                      <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-black uppercase text-brand-red">
                        {b.recompensa ? `${b.recompensa} Pts · ` : ""}Ver reto <ArrowRight size={14} />
                      </span>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg className="w-12 h-12 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
