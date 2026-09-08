/**
 * Tarjeta de estadística: icono + número grande + etiqueta, con una nota opcional debajo.
 *
 * Extraído de `badges/InsigniasClient.tsx` (donde vivía como `Contador`, privado) para poder
 * reutilizarlo en `VitrinasStats.tsx` sin duplicar el marcado. Presentacional puro, sin estado:
 * funciona igual dentro de un componente cliente o servidor.
 */
export default function StatTile({
  icono,
  valor,
  etiqueta,
  nota,
}: {
  icono: React.ReactNode;
  valor: string;
  etiqueta: string;
  nota?: string;
}) {
  return (
    <article className="bg-black/5 dark:bg-white/5 rounded-xl px-4 py-3 flex flex-col items-center sm:items-start gap-1">
      {icono}
      <p className="text-2xl sm:text-3xl font-black leading-none tabular-nums">{valor}</p>
      <h2 className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">{etiqueta}</h2>
      {nota && <p className="text-[10px] font-bold text-brand-green">{nota}</p>}
    </article>
  );
}
