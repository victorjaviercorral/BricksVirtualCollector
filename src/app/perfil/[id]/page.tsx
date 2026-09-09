import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PerfilPublicoClient from "./PerfilPublicoClient";

export default async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("usuarios_perfil")
    .select("id, username, alias, avatar_url, creado_en, es_invitado")
    .eq("id", id)
    .single();

  // Aislamiento de invitados (ADR-011, Fase 5): el perfil de un invitado no es una superficie
  // pública. `usuarios_perfil` tiene política de SELECT `using(true)`, así que hay que filtrarlo
  // aquí. Se responde 404, no un perfil vacío, para no revelar que el id existe.
  if (!profile || profile.es_invitado) {
    notFound();
  }

  // Vitrinas públicas y publicadas de este usuario, con sus sets. RLS ("Public vitrinas are
  // viewable by everyone") ya filtra a nivel de base de datos, pero se repite el filtro aquí de
  // forma explícita para que el código no dependa en silencio de la política vigente.
  const { data: vitrinas } = await supabase
    .from("vitrinas")
    .select(`
      id,
      sets (
        id,
        nombre,
        tematica,
        num_piezas,
        bricks_recibidos,
        fotos ( url )
      )
    `)
    .eq("usuario_id", id)
    .eq("estado", "publicada")
    .eq("visibilidad", "pública");

  const sets = (vitrinas || []).flatMap((v) => v.sets || []);

  // El total de bricks se CUENTA, no se lee de usuarios_perfil.total_bricks_recibidos.
  // El trigger increment_bricks solo incrementa (no hay AFTER DELETE), así que borrar un set
  // cascadea sus filas de bricks_recibidos pero deja esa columna inflada. Contar filas es la
  // única fuente que no puede desviarse, y es la que ya usan el Hub y Mis Insignias: así este
  // perfil no muestra un número distinto del que ve su propio dueño.
  const setIds = sets.map((s: { id: string }) => s.id);
  let totalBricks = 0;
  if (setIds.length > 0) {
    const { count } = await supabase
      .from("bricks_recibidos")
      .select("*", { count: "exact", head: true })
      .in("set_id", setIds);
    totalBricks = count || 0;
  }

  return <PerfilPublicoClient profile={{ ...profile, total_bricks_recibidos: totalBricks }} sets={sets} />;
}
