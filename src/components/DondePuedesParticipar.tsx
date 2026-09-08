import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { recompensaEfectiva } from "@/lib/bounties";

/**
 * Dónde puede participar el usuario con lo que ya tiene: exposiciones activas en las que aún no
 * está y retos abiertos que todavía no ha reclamado.
 *
 * Vivía al final de "Mi Progreso", que era el peor sitio posible: allí el usuario está mirando
 * cómo le va, no decidiendo con qué set apuntarse. Ahora abre "Mis Vitrinas", que es donde tiene
 * sus sets delante y el incentivo tiene sentido.
 *
 * Es un Server Component (no necesita interactividad): solo pinta enlaces.
 */

export interface ExposicionRecomendada {
  id: string;
  titulo: string;
  descripcion?: string | null;
}

export interface BountyRecomendado {
  id: string;
  titulo?: string | null;
  nombre_set?: string | null;
  descripcion?: string | null;
  recompensa?: number | null;
}

export default function DondePuedesParticipar({
  exposiciones = [],
  bounties = [],
}: {
  exposiciones?: ExposicionRecomendada[];
  bounties?: BountyRecomendado[];
}) {
  // Sin nada que recomendar no se pinta una sección vacía: el usuario ya está en todo lo abierto.
  if (exposiciones.length === 0 && bounties.length === 0) return null;

  return (
    <section aria-labelledby="donde-participar" className="mb-4">
      <h2 id="donde-participar" className="font-display text-2xl font-black mb-2 uppercase tracking-tight">
        Dónde puedes participar
      </h2>
      <p className="text-sm font-bold text-foreground/60 mb-6">
        Apunta uno de tus sets y compite por una insignia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exposiciones.map((e) => (
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

        {bounties.map((b) => (
          <Link key={b.id} href="/bounties" className="block">
            <article className="bg-panel rounded-2xl neo-brutalism p-5 h-full flex flex-col hover:-translate-y-1 transition-transform group">
              <span className="text-[10px] font-black uppercase text-brand-red mb-1">Reto abierto</span>
              <h3 className="font-black text-foreground leading-tight uppercase group-hover:text-brand-red transition-colors">
                {b.titulo || b.nombre_set || "Reto de la comunidad"}
              </h3>
              <p className="text-sm text-foreground/70 font-bold line-clamp-2 mt-1">{b.descripcion}</p>
              <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-black uppercase text-brand-red">
                {/* La recompensa efectiva, no la nominal: es lo que de verdad se concede. */}
                {recompensaEfectiva(b.recompensa)} Bricks · Ver reto <ArrowRight size={14} />
              </span>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
