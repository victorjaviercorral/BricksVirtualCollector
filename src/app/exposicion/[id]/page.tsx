import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ExposicionClient from "./ExposicionClient";
import {
  contarBricksPorSet,
  motivoHistoricoVacio,
  rankingEnVivo,
  rankingOficial,
  type FilaRanking,
} from "@/lib/exposiciones";

const SELECT_SET_ANIDADO = `
  id,
  nombre,
  num_piezas,
  usuarios_perfil ( username ),
  fotos ( url )
`;

export default async function ExposicionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Fetch Exposicion
  const { data: exposicion } = await supabase
    .from("exposiciones_temporales")
    .select("*")
    .eq("id", id)
    .single();

  if (!exposicion) {
    notFound();
  }

  const archivada = exposicion.estado === "archivada";

  // Bricks emitidos para ESTA exposición. Tras archivar ya no se puede votar (migración
  // 20260819110000, verificada en pg_policies), así que para una exposición archivada este
  // recuento está congelado y solo se muestra como dato histórico, no reordena el ranking.
  const { data: bricks } = await supabase
    .from("bricks_recibidos")
    .select("set_id")
    .eq("exposicion_id", id);

  let ranking: FilaRanking[] = [];
  let motivoVacio: ReturnType<typeof motivoHistoricoVacio> = null;

  if (archivada) {
    // 2a. Vista OFICIAL post-cierre: el ranking real es lo que quedó en sets_insignias al
    // repartir las insignias, no un recálculo en vivo que podría divergir.
    const { data: insignias } = await supabase
      .from("sets_insignias")
      .select(`set_id, rango, titulo_insignia, sets ( ${SELECT_SET_ANIDADO} )`)
      .eq("exposicion_id", id);

    const { count: aprobadosCount } = await supabase
      .from("exposicion_sets")
      .select("id", { count: "exact", head: true })
      .eq("exposicion_id", id)
      .eq("estado", "aprobado");

    ranking = rankingOficial(insignias, contarBricksPorSet(bricks));
    motivoVacio = motivoHistoricoVacio(ranking.length, aprobadosCount || 0);
  } else {
    // 2b. Exposición activa: ranking en vivo desde bricks_recibidos (comportamiento previo).
    const { data: participaciones } = await supabase
      .from("exposicion_sets")
      .select(`id, estado, set_id, sets ( ${SELECT_SET_ANIDADO} )`)
      .eq("exposicion_id", id)
      .eq("estado", "aprobado");

    ranking = rankingEnVivo(participaciones, bricks);
  }

  // 3. Sesión y sets del usuario -- solo se necesitan para el modal de participación, que no
  // existe en una exposición archivada.
  const { data: { user } } = await supabase.auth.getUser();
  let userSets: { id: string; nombre: string; fotos: { url: string }[] | null }[] = [];
  if (user && !archivada) {
    const { data: mySets } = await supabase
      .from("sets")
      .select("id, nombre, fotos(url)")
      .eq("usuario_id", user.id);

    userSets = mySets || [];
  }

  return (
    <div className="bg-background min-h-screen">
      <ExposicionClient
        exposicion={exposicion}
        ranking={ranking}
        userSets={userSets}
        userId={user?.id || null}
        modo={archivada ? "oficial" : "live"}
        motivoVacio={motivoVacio}
      />
    </div>
  );
}
