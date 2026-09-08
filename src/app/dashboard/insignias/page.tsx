import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InsigniasClient from "@/components/badges/InsigniasClient";
import { getAgregadosUsuario } from "@/lib/queries/insignias-usuario";
import { evaluarInsignias } from "@/lib/insignias-usuario";

export default async function MisInsigniasPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtener perfil para fechas y configuración de privacidad
  const { data: userProfile } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('id', user.id)
    .single();

  // Hallazgo D3 (Iteración 4): esta página mostraba datos simulados porque ningún flujo real
  // repartía insignias todavía. Ahora que admin/exposiciones/page.tsx sí lo hace al archivar una
  // exposición, se consultan los datos reales.
  //
  // Las columnas que se piden de `sets` son exactamente las que necesitan los agregados del
  // sistema de insignias (ver src/lib/insignias-usuario.ts): una sola consulta alimenta el
  // recuento de sets, el total de piezas, las temáticas distintas, el set más antiguo y el set
  // más votado.
  const { data: userSets } = await supabase
    .from('sets')
    .select('id, num_piezas, tematica, anio_lanzamiento, bricks_recibidos')
    .eq('usuario_id', user.id);
  const userSetIds = (userSets || []).map((s) => s.id);

  let misInsignias: Array<{
    id: string;
    exposicion_id: string | null;
    rango: number | null;
    titulo_insignia: string;
    fecha_otorgada: string | null;
    exposiciones_temporales: { titulo: string } | { titulo: string }[] | null;
  }> = [];

  if (userSetIds.length > 0) {
    const { data } = await supabase
      .from('sets_insignias')
      .select('id, exposicion_id, rango, titulo_insignia, fecha_otorgada, exposiciones_temporales ( titulo )')
      .in('set_id', userSetIds)
      .order('fecha_otorgada', { ascending: false });
    misInsignias = data || [];
  }

  // Bounties reclamados (modelo multi-reclamo, D1). Se traen las filas completas, no solo el
  // recuento: la sección Recompensas necesita cada reclamo, y de ellas sale también el total de
  // Bricks ganados que alimenta la familia de insignias "Botín".
  const { data: reclamos } = await supabase
    .from('bounties_reclamados')
    .select('id, nombre_set, recompensa, creado_en, set_id, sets ( id, nombre )')
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: false });

  const agregados = await getAgregadosUsuario(supabase, user.id, {
    sets: userSets,
    setIds: userSetIds,
    insigniasDeSets: misInsignias,
    reclamos: reclamos || [],
    creadoEn: userProfile?.creado_en || user.created_at,
  });

  const insignias = evaluarInsignias(agregados);

  return (
    <InsigniasClient
      userProfile={userProfile || {}}
      user={user}
      misInsignias={misInsignias}
      agregados={agregados}
      insignias={insignias}
    />
  );
}
