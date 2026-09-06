import Link from "next/link";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { rangoFechasExposicion } from "@/lib/exposiciones";

/**
 * Índice de exposiciones (H5). Antes no existía ninguna ruta que listara todas las
 * exposiciones: solo se llegaba a la activa desde la portada o el Hub, y el enlace "Explorar
 * Exposiciones" de /dashboard/participaciones apuntaba aquí y daba 404. Es el punto de entrada
 * al histórico -- cada tarjeta abre la ficha canónica /exposicion/[id], que decide sola si
 * mostrar el ranking en vivo (activa) o el oficial congelado (archivada).
 */
export default async function ExposicionesIndexPage() {
  const supabase = await createClient();

  const { data: exposiciones } = await supabase
    .from("exposiciones_temporales")
    .select("id, titulo, descripcion, imagen_url, estado, es_continua, fecha_inicio, fecha_fin, creado_en")
    .order("creado_en", { ascending: false });

  const lista = exposiciones || [];
  const activas = lista.filter((e) => e.estado === "activa");
  const archivadas = lista.filter((e) => e.estado !== "activa");
  const ordenadas = [...activas, ...archivadas];

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-panel text-foreground px-4 py-2 rounded-xl border-2 border-foreground font-bold hover:bg-brand-yellow hover:text-black transition-colors mb-8"
        >
          <ArrowLeft size={20} /> Volver
        </Link>

        <h1 className="font-display font-black text-4xl md:text-5xl mb-2">Exposiciones</h1>
        <p className="text-foreground/70 font-bold mb-10">
          Eventos temáticos de la comunidad. Consulta el ranking de los que están en curso y el
          palmarés oficial de los que ya se cerraron.
        </p>

        {ordenadas.length === 0 ? (
          <div className="text-center py-24 bg-panel border-2 border-dashed border-foreground rounded-3xl">
            <p className="font-display font-black text-2xl text-foreground/50">Todavía no hay exposiciones.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {ordenadas.map((expo) => {
              const activa = expo.estado === "activa";
              return (
                <Link
                  key={expo.id}
                  href={`/exposicion/${expo.id}`}
                  className={`group bg-panel rounded-2xl border-2 border-foreground overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] dark:hover:shadow-[6px_6px_0px_0px_#F8F9FA] transition-all ${activa ? "" : "opacity-90"}`}
                >
                  <div className="relative h-44 border-b-2 border-foreground overflow-hidden bg-black/5">
                    {expo.imagen_url && (
                      <img
                        src={expo.imagen_url}
                        alt={expo.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div
                      className={`absolute top-3 left-3 text-xs font-black uppercase px-2 py-1 rounded border-2 border-black ${activa ? "bg-brand-yellow text-black" : "bg-foreground text-background"}`}
                    >
                      {activa ? "Activa" : "Finalizada"}
                    </div>
                    {!activa && (
                      <div className="absolute top-3 right-3 bg-white/90 text-black rounded-full p-1.5 border-2 border-black">
                        <Trophy size={16} />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="font-display font-bold text-xl leading-tight mb-1">{expo.titulo}</h2>
                    <p className="text-sm font-medium text-foreground/70 line-clamp-2 mb-3">{expo.descripcion}</p>
                    <div className="mt-auto flex items-center justify-between text-xs font-bold text-foreground/60">
                      <span>{rangoFechasExposicion(expo)}</span>
                      <span className="inline-flex items-center gap-1 text-brand-blue group-hover:gap-2 transition-all">
                        {activa ? "Ver ranking" : "Ver palmarés"} <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
