"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Award, Calendar, Globe, Star, Target, Users } from "lucide-react";
import BadgeShowcase from "./BadgeShowcase";
import ExhibitionPassport, { type Sello } from "./ExhibitionPassport";
import CommunityMosaic from "./CommunityMosaic";

interface InsigniaFila {
  id: string;
  rango: number | null;
  titulo_insignia: string;
  fecha_otorgada: string | null;
  exposiciones_temporales: { titulo: string } | { titulo: string }[] | null;
}

export default function InsigniasClient({
  userProfile,
  user,
  misInsignias = [],
  bountiesCount = 0,
}: {
  userProfile: any;
  user: any;
  misInsignias?: InsigniaFila[];
  bountiesCount?: number;
}) {
  const [activeTab, setActiveTab] = useState<'insignias' | 'pasaporte' | 'mosaico'>('insignias');

  // Calcular tiempo en la comunidad
  const createdAt = userProfile?.creado_en || user?.created_at;
  const memberSince = createdAt ? format(new Date(createdAt), "MMMM yyyy", { locale: es }) : "Desconocido";

  // Hallazgo D3 (Iteración 4): sin tipos generados de Supabase (bloqueado por A1, ver ADR-010),
  // el cliente infiere la relación exposiciones_temporales como array salvo que se declare
  // explícitamente -- mismo patrón que SetDetailClient.tsx.
  const sellos: Sello[] = misInsignias.map((i) => {
    const expo = Array.isArray(i.exposiciones_temporales) ? i.exposiciones_temporales[0] : i.exposiciones_temporales;
    return {
      id: i.id,
      titulo: expo?.titulo || "Exposición",
      fecha: i.fecha_otorgada,
      posicion: i.titulo_insignia,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header / Resumen del Coleccionista */}
      <div className="bg-panel border-2 border-foreground rounded-2xl shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] p-6 sm:p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-brand-yellow overflow-hidden bg-white shrink-0 flex items-center justify-center">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon placeholder />
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight mb-2">
            Mis Logros
          </h1>

          <p className="text-foreground/70 font-medium mb-6">
            Coleccionista activo desde <strong className="text-foreground capitalize">{memberSince}</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl">
              <Target className="text-brand-red" size={20} />
              <div>
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wider">Bounties</p>
                <p className="font-bold text-lg leading-none">{bountiesCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl">
              <Star className="text-brand-yellow" size={20} />
              <div>
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wider">Insignias</p>
                <p className="font-bold text-lg leading-none">{sellos.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl">
              <Globe className="text-brand-blue" size={20} />
              <div>
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wider">Mosaico</p>
                <p className="font-bold text-sm leading-none text-foreground/50">Próximamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Pestañas */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2 border-b-2 border-foreground/10">
        <button
          onClick={() => setActiveTab('insignias')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === 'insignias'
              ? 'bg-foreground text-background'
              : 'text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Award size={20} />
          Vitrina de Insignias
        </button>
        <button
          onClick={() => setActiveTab('pasaporte')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === 'pasaporte'
              ? 'bg-foreground text-background'
              : 'text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Calendar size={20} />
          Pasaporte de Exposiciones
          {sellos.length > 0 && (
            <span className="ml-1 text-xs bg-brand-blue/20 text-brand-blue rounded-full px-2 py-0.5">{sellos.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('mosaico')}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${
            activeTab === 'mosaico'
              ? 'bg-foreground text-background'
              : 'text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Users size={20} />
          Mosaico Comunitario
        </button>
      </div>

      {/* Contenido de las Pestañas */}
      <div className="min-h-[400px]">
        {activeTab === 'insignias' && <BadgeShowcase />}
        {activeTab === 'pasaporte' && <ExhibitionPassport sellos={sellos} />}
        {activeTab === 'mosaico' && <CommunityMosaic />}
      </div>
    </div>
  );
}

function UserIcon({ placeholder }: { placeholder?: boolean }) {
  return (
    <svg className="w-12 h-12 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
