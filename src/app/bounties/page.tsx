import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BountiesSectionClient from "@/components/BountiesSectionClient";

/**
 * Pantalla canónica de bounties (/bounties). Antes había dos implementaciones distintas del mismo
 * concepto: esta página usaba `BountiesClient` (componente propio, lógica del modelo de un solo
 * ganador que D1 eliminó, y como única acción "prefill de Mesa de Trabajo"), mientras que la home
 * usaba `BountiesSectionClient` con el flujo de reclamo real (reclamar con set existente o subir
 * uno nuevo, multi-reclamo). Se unifica en `BountiesSectionClient`: un solo componente y un solo
 * flujo de reclamo, aquí y en la home.
 */
export default async function BountiesPage() {
  const supabase = await createClient();
  const { data: bounties } = await supabase
    .from("bounties")
    .select("*")
    .eq("estado", "pendiente")
    .order("creado_en", { ascending: false });

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-panel text-foreground px-4 py-2 rounded-xl border-2 border-foreground font-bold hover:bg-brand-yellow hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Volver
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0">
            <Target size={28} />
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl">Bounties Comunitarios</h1>
        </div>
        <p className="text-foreground/70 font-bold mb-10 max-w-2xl">
          La comunidad busca estos sets. Recláma la recompensa en Bricks documentando el set: con
          uno que ya tengas en tu vitrina, o subiendo uno nuevo.
        </p>

        <BountiesSectionClient bounties={bounties || []} />
      </div>
    </div>
  );
}
