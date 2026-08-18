import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InsigniasClient from "@/components/badges/InsigniasClient";

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
  const { data: userSets } = await supabase.from('sets').select('id').eq('usuario_id', user.id);
  const userSetIds = (userSets || []).map((s) => s.id);

  let misInsignias: Array<{
    id: string;
    rango: number | null;
    titulo_insignia: string;
    fecha_otorgada: string | null;
    exposiciones_temporales: { titulo: string } | { titulo: string }[] | null;
  }> = [];

  if (userSetIds.length > 0) {
    const { data } = await supabase
      .from('sets_insignias')
      .select('id, rango, titulo_insignia, fecha_otorgada, exposiciones_temporales ( titulo )')
      .in('set_id', userSetIds)
      .order('fecha_otorgada', { ascending: false });
    misInsignias = data || [];
  }

  // Bounties reclamados (modelo multi-reclamo, D1): recuento real, sustituye al literal
  // simulatedBountiesCount = 12 que tenía InsigniasClient.
  const { count: bountiesCount } = await supabase
    .from('bounties_reclamados')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', user.id);

  return (
    <InsigniasClient
      userProfile={userProfile || {}}
      user={user}
      misInsignias={misInsignias}
      bountiesCount={bountiesCount || 0}
    />
  );
}
