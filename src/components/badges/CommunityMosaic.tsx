"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users } from "lucide-react";
import { ICONOS } from "./BadgeMedal";
import type { BloqueMosaico, EjeInsignia } from "@/lib/insignias-usuario";

/**
 * El Mosaico Comunitario: un bloque por cada hito conseguido por cualquier persona.
 *
 * Antes simulaba un grid de 40 bloques con propietarios y motivos inventados ("Simulamos que el
 * usuario logueado ha colocado 3 bloques"). La decisión D3 (Iteración 4) lo dejó en un estado
 * vacío honesto porque la mecánica no estaba diseñada: qué es un bloque, cómo se gana, quién lo
 * coloca. Ahora la respuesta sale del propio sistema de insignias -- **un bloque se gana
 * desbloqueando una insignia**, y lo coloca quien la consigue, sin curación ni esquema nuevo.
 *
 * Se lee solo de `insignias_usuario`: los podios de exposición llegan ahí a través del mismo
 * sync, así que no hay dos fuentes que puedan divergir.
 */

/** Mismo criterio de color que BadgeMedal: el eje agrupa, el icono identifica. Literales, no
 *  interpolados -- el JIT de Tailwind no genera clases construidas en runtime. */
const CLASES_EJE: Record<EjeInsignia, string> = {
  coleccion: "bg-brand-red/15 text-brand-red",
  comunidad: "bg-brand-yellow/15 text-brand-yellow",
  escaparate: "bg-brand-blue/15 text-brand-blue",
  competicion: "bg-brand-green/15 text-brand-green",
  rareza: "bg-brand-purple/15 text-brand-purple",
  podio: "bg-brand-teal/15 text-brand-teal",
};

export default function CommunityMosaic({
  bloques = [],
  totalHitos = 0,
}: {
  bloques?: BloqueMosaico[];
  /** Hitos de toda la comunidad, para poder decir cuántos hay más allá de los que se pintan. */
  totalHitos?: number;
}) {
  const mios = bloques.filter((b) => b.esMio).length;

  if (bloques.length === 0) {
    return (
      <div className="bg-panel border-2 border-dashed border-foreground/30 rounded-2xl p-12 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
          <Users size={32} />
        </div>
        <h3 className="text-xl font-display font-bold uppercase tracking-tight">
          El mural está por empezar
        </h3>
        <p className="text-foreground/60 max-w-md">
          Cada insignia que desbloquea cualquier miembro de la comunidad deja aquí su bloque.
          Todavía no hay ninguno: serás el primero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-foreground/60">
        {totalHitos === 1 ? "1 hito conseguido" : `${totalHitos} hitos conseguidos`} por la comunidad
        {mios > 0 && (
          <>
            {" · "}
            <span className="text-foreground">{mios === 1 ? "1 es tuyo" : `${mios} son tuyos`}</span>
          </>
        )}
      </p>

      <ul className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
        {bloques.map((b) => {
          const Icono = ICONOS[b.icono];
          const fecha = b.fecha ? format(new Date(b.fecha), "d MMM yyyy", { locale: es }) : null;
          const descripcion = [
            b.nombre,
            b.tramo ? `${b.familia} · nivel ${b.tramo}` : b.familia,
            `@${b.autor}`,
            fecha,
          ]
            .filter(Boolean)
            .join(" — ");

          return (
            <li key={b.id}>
              <div
                title={descripcion}
                aria-label={descripcion}
                className={`aspect-square rounded-lg flex items-center justify-center ${CLASES_EJE[b.eje]} ${
                  b.esMio
                    ? "border-[3px] border-foreground shadow-[2px_2px_0px_0px_var(--foreground)]"
                    : "border border-foreground/10"
                }`}
              >
                {Icono ? <Icono size={20} strokeWidth={2.25} aria-hidden="true" /> : null}
              </div>
            </li>
          );
        })}
      </ul>

      {totalHitos > bloques.length && (
        <p className="text-xs font-bold text-foreground/50">
          Se muestran los {bloques.length} más recientes.
        </p>
      )}
    </div>
  );
}
