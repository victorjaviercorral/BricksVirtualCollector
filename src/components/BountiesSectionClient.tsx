"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, CheckCircle2 } from "lucide-react";
import { recompensaEfectiva } from "@/lib/bounties";

export default function BountiesSectionClient({
  bounties,
  reclamados = [],
}: {
  bounties: any[];
  reclamados?: string[];
}) {
  const [selectedBounty, setSelectedBounty] = useState<any>(null);
  const [userSets, setUserSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  // Reclamos hechos en esta sesión, además de los que llegan del servidor (prop `reclamados`).
  // Evita que la tarjeta siga diciendo "Reclamar Misión" justo después de reclamar.
  const [reclamadosSesion, setReclamadosSesion] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const yaReclamado = (id: string) => reclamados.includes(id) || reclamadosSesion.includes(id);

  const closeModal = () => {
    setSelectedBounty(null);
    setSelectedSetId(null);
    openerRef.current?.focus();
  };

  // Diálogo accesible: Esc para cerrar y foco inicial en el botón de cerrar.
  useEffect(() => {
    if (!selectedBounty) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBounty]);

  const handleOpenBounty = async (bounty: any, e: React.MouseEvent<HTMLButtonElement>) => {
    openerRef.current = e.currentTarget;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión para reclamar Bounties");
      router.push("/login");
      return;
    }

    setSelectedBounty(bounty);
    setLoadingSets(true);
    const { data } = await supabase
      .from("sets")
      .select("id, nombre, fotos(url)")
      .eq("usuario_id", user.id);

    if (data) setUserSets(data);
    setLoadingSets(false);
  };

  const handleDirectClaim = async () => {
    if (!selectedSetId) return;
    setClaiming(true);

    try {
      const res = await fetch("/api/bounties/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bountyId: selectedBounty.id, setId: selectedSetId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al reclamar el bounty");
      }

      toast.success("¡Bounty reclamado! Los Bricks van directos a tu set.");
      setReclamadosSesion((prev) => [...prev, selectedBounty.id]);
      setSelectedBounty(null);
      setSelectedSetId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (!bounties || bounties.length === 0) {
    return <p className="font-bold text-black/50 text-center">No hay bounties activos ahora mismo.</p>;
  }

  return (
    <>
      <div className="w-full flex flex-col gap-3">
        {bounties.map(b => {
          const reclamado = yaReclamado(b.id);
          return (
            <div key={b.id} className="bg-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA]">
              <div className="text-left">
                <div className="font-mono text-xs font-black bg-brand-red text-white px-2 py-1 rounded inline-block mb-2">+{recompensaEfectiva(b.recompensa)} Bricks</div>
                <p className="font-bold text-foreground leading-tight text-lg">{b.nombre_set}</p>
              </div>
              {reclamado ? (
                <span className="shrink-0 inline-flex items-center gap-2 bg-brand-green/10 text-brand-green px-5 py-3 rounded-xl font-black text-sm border-2 border-brand-green">
                  <CheckCircle2 size={16} /> Ya reclamado
                </span>
              ) : (
                <button
                  onClick={(e) => handleOpenBounty(b, e)}
                  className="shrink-0 bg-brand-blue text-white px-5 py-3 rounded-xl font-black text-sm border-2 border-foreground shadow-[2px_2px_0px_0px_#0F172A] dark:shadow-[2px_2px_0px_0px_#F8F9FA] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0F172A] transition-all text-center"
                >
                  Reclamar Misión
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedBounty && (
        <div
          className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bounty-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-panel border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b-2 border-foreground bg-brand-yellow flex justify-between items-center shrink-0">
              <h3 id="bounty-modal-title" className="font-display font-black text-2xl text-black">Reclamar Bounty</h3>
              <button ref={closeBtnRef} onClick={closeModal} aria-label="Cerrar" className="text-black font-black text-xl hover:scale-110 transition-transform">X</button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <p className="font-bold text-foreground/70 mb-1">Misión actual:</p>
                <h4 className="font-display font-black text-2xl">{selectedBounty.nombre_set}</h4>
                <div className="font-mono font-black text-brand-red mt-2">Recompensa: +{recompensaEfectiva(selectedBounty.recompensa)} Bricks</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opción A: Set Existente */}
                <div className="border-2 border-foreground rounded-2xl p-6 bg-background">
                  <h5 className="font-display font-black text-xl mb-4">Opción 1: De mi Vitrina</h5>
                  <p className="text-sm font-bold text-foreground/70 mb-4">Si ya has documentado este set, elígelo aquí para cobrar la recompensa instantáneamente.</p>

                  {loadingSets ? (
                    <div className="text-center py-8 font-bold">Cargando tus sets...</div>
                  ) : userSets.length > 0 ? (
                    <div className="flex flex-col gap-3 max-h-[30vh] overflow-y-auto pr-2">
                      {userSets.map(set => (
                        <button
                          key={set.id}
                          type="button"
                          aria-pressed={selectedSetId === set.id}
                          onClick={() => setSelectedSetId(set.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-left ${selectedSetId === set.id ? 'border-brand-blue bg-brand-blue/5' : 'border-foreground/20 hover:border-foreground/50'}`}
                        >
                          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-black/5 relative">
                            <img src={set.fotos?.[0]?.url || ''} alt={set.nombre} className="w-full h-full object-cover" />
                          </div>
                          <p className="font-bold text-sm truncate flex-1">{set.nombre}</p>
                          {selectedSetId === set.id && <CheckCircle2 className="text-brand-blue" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-panel border-2 border-dashed border-foreground/20 rounded-xl">
                      <p className="font-bold text-foreground/50 text-sm">No tienes sets subidos aún.</p>
                    </div>
                  )}

                  <button
                    onClick={handleDirectClaim}
                    disabled={claiming || !selectedSetId}
                    className="w-full mt-4 py-3 rounded-xl bg-brand-green text-white border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] font-black disabled:opacity-50 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all"
                  >
                    {claiming ? "Procesando..." : "Cobrar Recompensa Directa"}
                  </button>
                </div>

                {/* Opción B: Nuevo Set */}
                <div className="border-2 border-foreground rounded-2xl p-6 bg-brand-blue/10 border-dashed flex flex-col justify-center text-center">
                  <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    <Plus size={32} />
                  </div>
                  <h5 className="font-display font-black text-xl mb-2 text-brand-blue">Opción 2: Subir Nuevo Set</h5>
                  <p className="text-sm font-bold text-brand-blue/70 mb-6">¿Todavía no lo has documentado? Ve a tu Mesa de Trabajo y súbelo ahora.</p>
                  <Link
                    href={`/mesa-de-trabajo?bounty_id=${selectedBounty.id}`}
                    className="w-full py-3 rounded-xl bg-brand-blue text-white border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] font-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] transition-all block"
                  >
                    Ir a la Mesa de Trabajo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
