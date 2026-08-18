"use client";

import { CalendarDays, Award, Stamp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface Sello {
  id: string;
  titulo: string;
  fecha: string | null;
  posicion: string;
}

export default function ExhibitionPassport({ sellos }: { sellos: Sello[] }) {
  return (
    <div className="bg-[#f4f1ea] dark:bg-[#1a1814] border-2 border-foreground rounded-2xl shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] overflow-hidden">
      <div className="bg-brand-red text-white p-6 border-b-2 border-foreground flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black uppercase tracking-tight">Pasaporte Oficial</h2>
          <p className="text-sm font-medium opacity-80">Registro de Exposiciones BricksVirtualCollector</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50 backdrop-blur-sm">
          <Award size={32} />
        </div>
      </div>

      <div className="p-8 sm:p-12">
        {sellos.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-foreground/30 flex items-center justify-center text-foreground/30">
              <Stamp size={28} />
            </div>
            <p className="text-foreground/60 max-w-sm">
              Todavía no tienes ningún sello. Participa con un set en una exposición oficial y
              consíguelo cuando el evento se cierre.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sellos.map((sello) => {
              const esPodio = sello.posicion !== 'Participante';
              const colorClass = esPodio ? 'text-brand-blue border-brand-blue' : 'text-foreground/50 border-foreground/40';
              const fecha = sello.fecha
                ? format(new Date(sello.fecha), "d MMM yyyy", { locale: es })
                : null;

              return (
                <div key={sello.id} className="relative flex flex-col items-center justify-center p-6 aspect-square border-2 border-dashed border-foreground/20 rounded-full hover:border-foreground/50 transition-colors">
                  <div className={`absolute inset-0 m-4 rounded-full border-[6px] opacity-70 flex flex-col items-center justify-center text-center p-4 transform -rotate-12 ${colorClass}`}>
                    <p className="font-display font-black uppercase text-xl leading-none mb-1">{sello.titulo}</p>
                    {fecha && (
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase border-t-2 border-current pt-1 mt-2">
                        <CalendarDays size={10} />
                        {fecha}
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-2 bg-foreground text-background text-xs font-bold uppercase px-3 py-1 rounded-full shadow-sm">
                    {sello.posicion}
                  </div>
                </div>
              );
            })}

            <div className="relative flex flex-col items-center justify-center p-6 aspect-square border-2 border-dashed border-foreground/20 rounded-full opacity-50">
              <p className="text-sm font-bold uppercase text-foreground/40 text-center">Espacio para tu próxima exposición</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
