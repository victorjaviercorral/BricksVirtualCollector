import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParticipacionesClient from "./ParticipacionesClient";

export default async function ParticipacionesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 0. Perfil del usuario (hallazgo del 19/08/2026: el avatar de esta página estaba
  // hardcodeado a un dicebear de ejemplo, "seed=Felix" -- nunca se había consultado el perfil
  // real aquí).
  const { data: userProfile } = await supabase
    .from("usuarios_perfil")
    .select("avatar_url, alias, username")
    .eq("id", user.id)
    .single();

  // 1. Fetch Exposiciones participations
  // Nota: filtrar exposicion_sets directamente por sets.usuario_id vía .eq() sobre una relación
  // anidada es propenso a fallos de PostgREST según la configuración del join. Se resuelve
  // obteniendo primero los IDs de sets del usuario y filtrando por ellos (ver validExposiciones
  // más abajo). Antes había aquí una primera consulta idéntica salvo el filtro, cuyo resultado
  // nunca se usaba -- una llamada de red completa desechada en cada carga de la página.
  const { data: userSets } = await supabase.from("sets").select("id").eq("usuario_id", user.id);
  const userSetIds = userSets?.map(s => s.id) || [];
  
  const { data: validExposiciones } = await supabase
    .from("exposicion_sets")
    .select(`
      id,
      estado,
      creado_en,
      exposiciones_temporales ( id, titulo, estado, imagen_url ),
      sets ( id, nombre, fotos ( url ) )
    `)
    .in("set_id", userSetIds);

  // Sin tipos generados de Supabase (bloqueado por A1, ver ADR-010), el cliente infiere las
  // relaciones foráneas como array salvo que se declaren explícitamente. En runtime cada
  // participación tiene una única exposición y un único set -- mismo patrón que
  // SetDetailClient.tsx / ParticipacionesDetailClient.tsx.
  const misExposiciones = (validExposiciones || []).map((p) => {
    const expo = Array.isArray(p.exposiciones_temporales) ? p.exposiciones_temporales[0] : p.exposiciones_temporales;
    const set = Array.isArray(p.sets) ? p.sets[0] : p.sets;
    return {
      id: p.id,
      estado: p.estado,
      exposiciones_temporales: expo ? { titulo: expo.titulo, estado: expo.estado, imagen_url: expo.imagen_url } : null,
      sets: set ? { id: set.id, nombre: set.nombre } : null,
    };
  });

  // 2. Fetch Bounties claimed by user
  // Modelo multi-reclamo (D1, Iteración 4): un bounty puede reclamarlo cualquier número de
  // personas, cada reclamo es su propia fila. Antes esto consultaba `bounties` filtrando por
  // `reclamado_por` -- ese modelo de un solo ganador se sustituyó en api/bounties/claim/route.ts.
  const { data: misBounties } = await supabase
    .from("bounties_reclamados")
    .select("*")
    .eq("usuario_id", user.id)
    .order("creado_en", { ascending: false });

  // 3. Fetch Insignias/Badges
  const { data: misInsignias } = await supabase
    .from("sets_insignias")
    .select(`
      id,
      rango,
      titulo_insignia,
      fecha_otorgada,
      exposiciones_temporales ( titulo ),
      sets ( nombre )
    `)
    .in("set_id", userSetIds);

  // 4. Fetch Active Exposiciones to recommend
  const { data: exposActivas } = await supabase
    .from("exposiciones_temporales")
    .select("id, titulo, descripcion, imagen_url")
    .eq("estado", "activa");

  // 5. Fetch Active Bounties to recommend
  const { data: bountiesActivos } = await supabase
    .from("bounties")
    .select("*")
    .eq("estado", "pendiente")
    .limit(5);

  return (
    <ParticipacionesClient
      userProfile={userProfile || {}}
      misExposiciones={misExposiciones}
      misBounties={misBounties || []}
      misInsignias={misInsignias || []}
      exposActivas={exposActivas || []}
      bountiesActivos={bountiesActivos || []}
    />
  );
}
