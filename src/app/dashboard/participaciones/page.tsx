import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParticipacionesClient from "./ParticipacionesClient";

export default async function ParticipacionesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

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

  // 2. Fetch Bounties claimed by user
  const { data: misBounties } = await supabase
    .from("bounties")
    .select("*")
    .eq("reclamado_por", user.id)
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
      misExposiciones={validExposiciones || []}
      misBounties={misBounties || []}
      misInsignias={misInsignias || []}
      exposActivas={exposActivas || []}
      bountiesActivos={bountiesActivos || []}
    />
  );
}
