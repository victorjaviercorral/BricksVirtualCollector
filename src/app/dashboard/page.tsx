import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HubClient from "./HubClient";

export default async function DashboardHubPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 1. Obtener perfil
  const { data: userProfile } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('id', user.id)
    .single();

  // Calcular total de bricks del usuario sumando los de todos sus sets
  const { data: vitrinas } = await supabase
    .from('vitrinas')
    .select('sets(id)')
    .eq('usuario_id', user.id);
    
  const setIds = vitrinas?.flatMap(v => v.sets?.map((s: any) => s.id) || []) || [];
  let totalBricks = 0;
  if (setIds.length > 0) {
    const { count } = await supabase
      .from('bricks_recibidos')
      .select('*', { count: 'exact', head: true })
      .in('set_id', setIds);
    totalBricks = count || 0;
  }
  const profileWithBricks = { ...userProfile, total_bricks_recibidos: totalBricks };

  // 2. Obtener Exposiciones Activas (para "Active Expositions" y "Upcoming Events" si no hay activa)
  const { data: exposicionesActivas } = await supabase
    .from('exposiciones_temporales')
    .select('*')
    .eq('estado', 'activa')
    .order('creado_en', { ascending: false });

  // 3. Obtener Bounties Activos (Se busca)
  const { data: bountiesActivos } = await supabase
    .from('bounties')
    .select('*')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })
    .limit(3);

  // 4. Obtener Sets de la Comunidad (limit 4 para Build of the Day + 3 recientes)
  const { data: ultimosSets } = await supabase
    .from('sets')
    .select('*, usuarios_perfil(username), fotos(url)')
    .order('creado_en', { ascending: false })
    .limit(4);

  const setDestacado = ultimosSets?.[0] || null;
  const comunidadSets = ultimosSets?.slice(1) || [];

  // 5. Obtener Última Insignia del usuario
  let ultimaInsignia = null;
  if (setIds.length > 0) {
    const { data: ultimasInsignias } = await supabase
      .from('sets_insignias')
      .select('*, exposiciones_temporales(titulo)')
      .in('set_id', setIds)
      .order('fecha_otorgada', { ascending: false })
      .limit(1);
    ultimaInsignia = ultimasInsignias?.[0] || null;
  }

  return (
    <HubClient 
      userProfile={profileWithBricks}
      exposicionesActivas={exposicionesActivas || []}
      bountiesActivos={bountiesActivos || []}
      setDestacado={setDestacado}
      comunidadSets={comunidadSets}
      ultimaInsignia={ultimaInsignia}
    />
  );
}