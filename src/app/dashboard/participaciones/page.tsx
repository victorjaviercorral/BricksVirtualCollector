import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParticipacionesClient from "./ParticipacionesClient";
import { contarBricksPorSet, posicionEnRankingVivo } from "@/lib/exposiciones";

export default async function ParticipacionesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 0. Perfil del usuario.
  const { data: userProfile } = await supabase
    .from("usuarios_perfil")
    .select("avatar_url, alias, username")
    .eq("id", user.id)
    .single();

  // 1. Participaciones del usuario en exposiciones. Se obtienen primero los IDs de sets del
  // usuario y se filtra por ellos (un .eq() sobre relación anidada es propenso a fallos de
  // PostgREST según la config del join).
  const { data: userSets } = await supabase.from("sets").select("id").eq("usuario_id", user.id);
  const userSetIds = userSets?.map((s) => s.id) || [];

  // Total de bricks recibidos por todos los sets del usuario -- el dato agregado canónico. Antes
  // solo vivía como número no clicable en el Hub; ahora "Mi Progreso" es su casa y el Hub enlaza
  // aquí.
  let totalBricksRecibidos = 0;
  if (userSetIds.length > 0) {
    const { count } = await supabase
      .from("bricks_recibidos")
      .select("*", { count: "exact", head: true })
      .in("set_id", userSetIds);
    totalBricksRecibidos = count || 0;
  }

  const { data: validExposiciones } = await supabase
    .from("exposicion_sets")
    .select(`
      id,
      estado,
      creado_en,
      exposicion_id,
      set_id,
      exposiciones_temporales ( id, titulo, estado, imagen_url, fecha_fin, es_continua ),
      sets ( id, nombre, fotos ( url ) )
    `)
    .in("set_id", userSetIds);

  // Sin tipos generados de Supabase (bloqueado por A1, ver ADR-010) el cliente infiere las
  // relaciones foráneas como array salvo que se declaren explícitamente.
  const misExposicionesTodas = (validExposiciones || []).map((p) => {
    const expo = Array.isArray(p.exposiciones_temporales) ? p.exposiciones_temporales[0] : p.exposiciones_temporales;
    const set = Array.isArray(p.sets) ? p.sets[0] : p.sets;
    return {
      id: p.id,
      estado: p.estado,
      exposicion_id: p.exposicion_id,
      set_id: p.set_id,
      exposiciones_temporales: expo
        ? { titulo: expo.titulo, estado: expo.estado, imagen_url: expo.imagen_url, fecha_fin: expo.fecha_fin, es_continua: expo.es_continua }
        : null,
      sets: set ? { id: set.id, nombre: set.nombre } : null,
    };
  });

  // H5: esta vista es ahora un panel de ACTIVIDAD EN CURSO. El histórico de exposiciones
  // finalizadas (resultado real de sets_insignias) vive en /dashboard/insignias -> Pasaporte,
  // fuente única de verdad. Aquí solo lo que sigue vivo.
  const misExposiciones = misExposicionesTodas.filter(
    (e) => e.exposiciones_temporales?.estado === "activa"
  );

  // 2. Puesto en vivo de cada participación aprobada en una exposición activa.
  const idsActivas = Array.from(
    new Set(misExposiciones.filter((e) => e.estado === "aprobado").map((e) => e.exposicion_id))
  );

  let posiciones: Record<string, { posicion: number; bricks: number; total: number } | null> = {};
  if (idsActivas.length > 0) {
    const [{ data: aprobados }, { data: bricks }] = await Promise.all([
      supabase
        .from("exposicion_sets")
        .select("exposicion_id, set_id, creado_en")
        .eq("estado", "aprobado")
        .in("exposicion_id", idsActivas)
        .order("creado_en", { ascending: true }),
      supabase.from("bricks_recibidos").select("exposicion_id, set_id").in("exposicion_id", idsActivas),
    ]);

    posiciones = Object.fromEntries(
      misExposiciones
        .filter((e) => e.estado === "aprobado" && e.set_id)
        .map((e) => {
          const setsExpo = (aprobados || [])
            .filter((a) => a.exposicion_id === e.exposicion_id)
            .map((a) => a.set_id);
          const bricksExpo = contarBricksPorSet(
            (bricks || []).filter((b) => b.exposicion_id === e.exposicion_id)
          );
          return [e.id, posicionEnRankingVivo(e.set_id as string, setsExpo, bricksExpo)];
        })
    );
  }

  // 3. Bounties reclamados por el usuario (modelo multi-reclamo, D1).
  const { data: misBounties } = await supabase
    .from("bounties_reclamados")
    .select("*")
    .eq("usuario_id", user.id)
    .order("creado_en", { ascending: false });

  // 4. Recomendaciones: exposiciones activas donde el usuario NO participa todavía.
  const { data: exposActivas } = await supabase
    .from("exposiciones_temporales")
    .select("id, titulo, descripcion, imagen_url")
    .eq("estado", "activa");

  const idsDondeParticipo = new Set(misExposicionesTodas.map((e) => e.exposicion_id));
  const exposRecomendadas = (exposActivas || []).filter((e) => !idsDondeParticipo.has(e.id));

  // 5. Recomendaciones: bounties abiertos que el usuario NO ha reclamado.
  const { data: bountiesActivos } = await supabase
    .from("bounties")
    .select("*")
    .eq("estado", "pendiente")
    .limit(8);

  const idsBountyReclamados = new Set((misBounties || []).map((b) => b.bounty_id));
  const bountiesRecomendados = (bountiesActivos || []).filter((b) => !idsBountyReclamados.has(b.id));

  return (
    <ParticipacionesClient
      userProfile={userProfile || {}}
      totalBricksRecibidos={totalBricksRecibidos}
      misExposiciones={misExposiciones}
      posiciones={posiciones}
      misBounties={misBounties || []}
      exposRecomendadas={exposRecomendadas}
      bountiesRecomendados={bountiesRecomendados}
    />
  );
}
