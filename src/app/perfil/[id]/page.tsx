import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PerfilPublicoClient from "./PerfilPublicoClient";

export default async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("usuarios_perfil")
    .select("id, username, alias, avatar_url, total_bricks_recibidos, creado_en")
    .eq("id", id)
    .single();

  if (!profile) {
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

  return <PerfilPublicoClient profile={profile} sets={sets} />;
}
