import { Boxes, Heart } from "lucide-react";
import StatTile from "./StatTile";
import { formatearNumero } from "./badges/BadgeMedal";

/**
 * Contexto rápido sobre la colección del usuario, al principio de "Mis Vitrinas": cuántos sets
 * tiene documentados, cuántos bricks ha recibido la comunidad y en qué temáticas se mueve.
 *
 * Reutiliza deliberadamente lo construido para "Mis Insignias" en vez de inventar un estilo
 * nuevo: mismo componente de tarjeta (`StatTile`), mismo icono y color para "Bricks recibidos"
 * (`Heart` en `brand-yellow`), y el mismo `formatearNumero` -- que existe precisamente porque
 * `toLocaleString("es-ES")` no agrupa millares de forma fiable en todos los runtimes.
 *
 * Se oculta por completo si el usuario todavía no tiene ningún set: no hay nada de qué dar
 * contexto, y "0 Sets · 0 Bricks recibidos" encima del estado vacío de la rejilla sería ruido.
 */
export default function VitrinasStats({
  numSets,
  bricksRecibidos,
  temas,
}: {
  numSets: number;
  bricksRecibidos: number;
  temas: string[];
}) {
  if (numSets === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 sm:inline-grid sm:grid-flow-col gap-3 mb-4">
        <StatTile
          icono={<Boxes size={20} className="text-brand-blue" strokeWidth={2.5} />}
          valor={formatearNumero(numSets)}
          etiqueta="Sets"
        />
        <StatTile
          icono={<Heart size={20} className="text-brand-yellow fill-brand-yellow" strokeWidth={2.5} />}
          valor={formatearNumero(bricksRecibidos)}
          etiqueta="Bricks recibidos"
        />
      </div>

      {temas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mr-1">
            Temáticas
          </span>
          {temas.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-black/5 dark:bg-white/5 text-foreground/70"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
