import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditarSetClient from "./EditarSetClient";

export default async function EditarMesaTrabajo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // .eq('usuario_id', user.id) hace de doble candado junto a RLS: si el set es de otro usuario,
  // la consulta no devuelve nada y caemos a notFound() -- nunca se edita el set de otra persona.
  const { data: set } = await supabase
    .from("sets")
    .select("id, nombre, tematica, num_piezas, estado, num_set, notas, vitrina_id, fotos ( url )")
    .eq("id", id)
    .eq("usuario_id", user.id)
    .single();

  if (!set) {
    notFound();
  }

  return <EditarSetClient set={set} />;
}
