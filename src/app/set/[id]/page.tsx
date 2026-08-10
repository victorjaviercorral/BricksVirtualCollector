import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SetDetailClient from "./SetDetailClient";

export default async function SetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS ("Public sets are viewable by everyone" / "Users can view their own sets") ya decide qué
  // filas puede ver este visitante: si el set pertenece a una vitrina privada y no es su dueño,
  // la consulta simplemente no devuelve nada, y caemos a notFound() de forma natural.
  const { data: set } = await supabase
    .from("sets")
    .select(`
      id,
      nombre,
      tematica,
      num_piezas,
      estado,
      bricks_recibidos,
      creado_en,
      fotos ( url ),
      usuarios_perfil ( id, alias, username )
    `)
    .eq("id", id)
    .single();

  if (!set) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  let yaVotado = false;
  if (user) {
    const { data: brickPropio } = await supabase
      .from("bricks_recibidos")
      .select("id")
      .eq("set_id", id)
      .eq("hash_visitante", user.id)
      .maybeSingle();
    yaVotado = !!brickPropio;
  }

  return <SetDetailClient set={set} isLoggedIn={!!user} yaVotado={yaVotado} />;
}
