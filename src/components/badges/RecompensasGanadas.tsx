"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Coins, Target } from "lucide-react";
import { formatearNumero } from "./BadgeMedal";
import { totalBricksGanados } from "@/lib/bounties";
import type { ReclamoBounty } from "@/lib/queries/insignias-usuario";

/**
 * Las recompensas de retos, que hasta ahora no tenían dónde consultarse.
 *
 * El circuito estaba roto por tres sitios a la vez: el usuario reclamaba un bounty, se le
 * concedía la recompensa y no existía ninguna pantalla donde ver lo ganado ni acceder a ello; la
 * interfaz lo llamaba "pts" en unos sitios y "Bricks" en otros, para el mismo dato; y la tarjeta
 * del reto anunciaba una cifra que el servidor recortaba en silencio.
 *
 * Aquí se cierra el círculo con la verdad de `api/bounties/claim/route.ts`: la recompensa se
 * concede en **Bricks**, filas reales de `bricks_recibidos` sobre el set con el que se reclamó.
 * Por eso también suman en "bricks recibidos" -- y se dice explícitamente, en vez de dejar al
 * usuario preguntándose por qué le cuadra o no le cuadra el total.
 *
 * `bounties_reclamados.recompensa` guarda el valor YA concedido (capado), así que este total es
 * lo que de verdad se recibió, no lo que se prometió.
 */
export default function RecompensasGanadas({ reclamos = [] }: { reclamos?: ReclamoBounty[] }) {
  const total = totalBricksGanados(reclamos);

  if (reclamos.length === 0) {
    return (
      <div className="bg-panel border-2 border-dashed border-foreground/30 rounded-2xl p-10 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center">
          <Target size={28} />
        </div>
        <p className="font-black text-lg">Todavía no has reclamado ningún reto</p>
        <p className="text-foreground/60 max-w-md text-sm font-bold">
          La comunidad publica retos buscando sets concretos. Al reclamar uno, los Bricks de
          recompensa van directos al set con el que lo documentes.
        </p>
        <Link
          href="/bounties"
          className="bg-brand-green text-white font-black py-3 px-6 rounded-full neo-brutalism-sm hover:-translate-y-1 transition-transform"
        >
          Ver retos abiertos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-panel border-2 border-foreground rounded-2xl neo-brutalism p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-green/15 text-brand-green flex items-center justify-center shrink-0">
          <Coins size={28} />
        </div>
        <div>
          <p className="text-3xl font-black leading-none tabular-nums">
            {formatearNumero(total)} <span className="text-lg">Bricks ganados</span>
          </p>
          <p className="text-sm font-bold text-foreground/60 mt-1">
            Cada reto se cobra en Bricks que van directos al set con el que lo reclamaste — por eso
            también suman en tus bricks recibidos.
          </p>
        </div>
      </div>

      <ul className="divide-y-2 divide-foreground/10 border-2 border-foreground/10 rounded-2xl overflow-hidden">
        {reclamos.map((r) => {
          // Sin tipos generados de Supabase (bloqueado por A1, ver ADR-010) la relación llega como
          // objeto o como array según el join.
          const set = Array.isArray(r.sets) ? r.sets[0] : r.sets;
          const fecha = r.creado_en ? format(new Date(r.creado_en), "d MMM yyyy", { locale: es }) : null;

          return (
            <li key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-panel">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/insignias/bounty/${r.id}`}
                  className="font-black uppercase hover:text-brand-blue transition-colors"
                >
                  {r.nombre_set || "Reto de la comunidad"}
                </Link>
                <p className="text-sm font-bold text-foreground/60">
                  {set ? (
                    <>
                      Reclamado con{" "}
                      <Link href={`/set/${set.id}`} className="text-brand-blue hover:underline">
                        {set.nombre}
                      </Link>
                    </>
                  ) : (
                    "Reclamo anterior al registro del set"
                  )}
                  {fecha && ` · ${fecha}`}
                </p>
              </div>
              <span className="font-black text-brand-green tabular-nums whitespace-nowrap">
                +{formatearNumero(r.recompensa || 0)} Bricks
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
