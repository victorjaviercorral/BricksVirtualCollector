"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Blocks, Heart, Plane, Target } from "lucide-react";
import BadgeShowcase from "./BadgeShowcase";
import ExhibitionPassport, { type Sello } from "./ExhibitionPassport";
import CommunityMosaic from "./CommunityMosaic";
import ActividadEnCurso from "./ActividadEnCurso";
import RecompensasGanadas from "./RecompensasGanadas";
import SincronizarInsignias from "./SincronizarInsignias";
import { formatearNumero } from "./BadgeMedal";
import StatTile from "@/components/StatTile";
import {
  avisoPiezasIncompletas,
  type AgregadosUsuario,
  type BloqueMosaico,
  type ResultadoInsignias,
} from "@/lib/insignias-usuario";
import type {
  ParticipacionActiva,
  PosicionVivo,
  ReclamoBounty,
} from "@/lib/queries/insignias-usuario";

interface InsigniaFila {
  id: string;
  exposicion_id: string | null;
  rango: number | null;
  titulo_insignia: string;
  fecha_otorgada: string | null;
  exposiciones_temporales: { titulo: string } | { titulo: string }[] | null;
}

interface UserProfileResumen {
  avatar_url?: string | null;
  creado_en?: string | null;
}

/** Secciones de la página, en orden. Los chips de ancla se generan de aquí. */
const SECCIONES = [
  { id: "insignias", etiqueta: "Insignias" },
  { id: "en-curso", etiqueta: "En curso" },
  { id: "recompensas", etiqueta: "Recompensas" },
  { id: "pasaporte", etiqueta: "Pasaporte" },
  { id: "mosaico", etiqueta: "Mosaico" },
];

/**
 * "Mis Insignias": la única pantalla de progreso del usuario.
 *
 * Antes era un sistema de 3 pestañas y convivía con /dashboard/participaciones ("Mi Progreso"),
 * que repetía cabecera, avatar y estadísticas -- la duplicación que prohíbe la regla 2 de
 * AGENTS.md. Ahora es una sola página con secciones y chips de ancla.
 *
 * Regla que la mantiene fuera de ser un cajón de sastre: cada sección responde a una pregunta
 * distinta y NINGUNA re-pinta el dato de otra. Ninguna sección nueva entra aquí sin retirar su
 * duplicado de otra pantalla.
 */
export default function InsigniasClient({
  userProfile,
  user,
  misInsignias = [],
  agregados,
  insignias,
  mosaico = { bloques: [], total: 0 },
  actividad = { participaciones: [], posiciones: {} },
  reclamos = [],
}: {
  userProfile: UserProfileResumen | null;
  user: { created_at?: string } | null;
  misInsignias?: InsigniaFila[];
  agregados: AgregadosUsuario;
  insignias: ResultadoInsignias;
  mosaico?: { bloques: BloqueMosaico[]; total: number };
  actividad?: { participaciones: ParticipacionActiva[]; posiciones: Record<string, PosicionVivo | null> };
  reclamos?: ReclamoBounty[];
}) {
  const createdAt = userProfile?.creado_en || user?.created_at;
  const memberSince = createdAt ? format(new Date(createdAt), "MMMM yyyy", { locale: es }) : "Desconocido";

  // Sin tipos generados de Supabase (bloqueado por A1, ver ADR-010), el cliente infiere la
  // relación exposiciones_temporales como array salvo que se declare explícitamente -- mismo
  // patrón que SetDetailClient.tsx.
  const sellos: Sello[] = misInsignias.map((i) => {
    const expo = Array.isArray(i.exposiciones_temporales) ? i.exposiciones_temporales[0] : i.exposiciones_temporales;
    return {
      id: i.id,
      exposicion_id: i.exposicion_id,
      titulo: expo?.titulo || "Exposición",
      fecha: i.fecha_otorgada,
      posicion: i.titulo_insignia,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <SincronizarInsignias />

      {/* Cabecera */}
      <div className="bg-panel border-2 border-foreground rounded-2xl shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-brand-yellow overflow-hidden bg-white shrink-0 flex items-center justify-center">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <UserIcon />
          )}
        </div>

        <div className="flex-1 w-full text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-display font-black uppercase tracking-tight mb-2">
            Mis Insignias
          </h1>

          <p className="text-foreground/70 font-medium mb-6">
            Coleccionista activo desde <strong className="text-foreground capitalize">{memberSince}</strong>
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              icono={<Blocks size={20} className="text-brand-red" strokeWidth={2.5} />}
              valor={formatearNumero(agregados.piezasTotales)}
              etiqueta="Piezas"
            />
            <StatTile
              icono={<Heart size={20} className="text-brand-yellow fill-brand-yellow" strokeWidth={2.5} />}
              valor={formatearNumero(agregados.bricksRecibidos)}
              etiqueta="Bricks recibidos"
            />
            <StatTile
              icono={<Plane size={20} className="text-brand-blue" strokeWidth={2.5} />}
              valor={formatearNumero(agregados.exposicionesAprobadas)}
              etiqueta="Exposiciones"
            />
            <StatTile
              icono={<Target size={20} className="text-brand-green" strokeWidth={2.5} />}
              valor={formatearNumero(agregados.bountiesReclamados)}
              etiqueta="Retos"
              nota={
                agregados.bricksDeBounties > 0
                  ? `${formatearNumero(agregados.bricksDeBounties)} Bricks ganados`
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* Chips de ancla: sustituyen a las pestañas. Todo el contenido está siempre en la página;
          esto solo lleva a la sección, así que nada queda escondido tras un clic. */}
      <nav aria-label="Secciones de Mis Insignias" className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2 border-b-2 border-foreground/10">
        {SECCIONES.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="px-5 py-2 font-bold text-sm rounded-full border-2 border-foreground/20 hover:border-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            {s.etiqueta}
          </a>
        ))}
      </nav>

      <div className="space-y-16">
        <section id="insignias" className="scroll-mt-24">
          <BadgeShowcase insignias={insignias} avisoPiezas={avisoPiezasIncompletas(agregados)} />
        </section>

        <section id="en-curso" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-6">En curso</h2>
          <ActividadEnCurso
            participaciones={actividad.participaciones}
            posiciones={actividad.posiciones}
          />
        </section>

        <section id="recompensas" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-6">Recompensas</h2>
          <RecompensasGanadas reclamos={reclamos} />
        </section>

        <section id="pasaporte" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-6">
            Pasaporte de Exposiciones
          </h2>
          <ExhibitionPassport sellos={sellos} />
        </section>

        <section id="mosaico" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight mb-6">
            Mosaico Comunitario
          </h2>
          <CommunityMosaic bloques={mosaico.bloques} totalHitos={mosaico.total} />
        </section>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg className="w-12 h-12 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
