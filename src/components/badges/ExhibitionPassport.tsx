"use client";

import { CalendarDays, MapPin, Award } from "lucide-react";

export default function ExhibitionPassport() {
  const stamps = [
    { id: 1, title: "Star Wars Day 2026", date: "May 4, 2026", location: "Virtual Hub", position: "2º Puesto", color: "text-brand-blue border-brand-blue" },
    { id: 2, title: "Vintage Classics", date: "Jan 15, 2026", location: "Global", position: "Participante", color: "text-brand-red border-brand-red" },
  ];

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
      
      <div className="p-8 sm:p-12 bg-[url('/noise.png')] opacity-95">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stamps.map((stamp) => (
            <div key={stamp.id} className="relative flex flex-col items-center justify-center p-6 aspect-square border-2 border-dashed border-foreground/20 rounded-full hover:border-foreground/50 transition-colors">
              {/* Sello visual (Stamp) */}
              <div className={`absolute inset-0 m-4 rounded-full border-[6px] opacity-70 flex flex-col items-center justify-center text-center p-4 transform -rotate-12 ${stamp.color}`}>
                <p className="font-display font-black uppercase text-xl leading-none mb-1">{stamp.title}</p>
                <div className="flex items-center gap-1 text-xs font-bold uppercase mb-2">
                  <MapPin size={10} />
                  {stamp.location}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase border-t-2 border-current pt-1">
                  <CalendarDays size={10} />
                  {stamp.date}
                </div>
              </div>
              
              {/* Etiqueta de posición */}
              <div className="absolute -bottom-2 bg-foreground text-background text-xs font-bold uppercase px-3 py-1 rounded-full shadow-sm">
                {stamp.position}
              </div>
            </div>
          ))}
          
          {/* Espacio vacío para próximo sello */}
          <div className="relative flex flex-col items-center justify-center p-6 aspect-square border-2 border-dashed border-foreground/20 rounded-full opacity-50">
            <p className="text-sm font-bold uppercase text-foreground/40 text-center">Espacio para tu próxima exposición</p>
          </div>
        </div>
      </div>
    </div>
  );
}
