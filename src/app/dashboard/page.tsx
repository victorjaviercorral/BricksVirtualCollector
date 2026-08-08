import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";

export default async function Dashboard() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtener perfil
  const { data: userProfile } = await supabase
    .from('usuarios_perfil')
    .select('*')
    .eq('id', user.id)
    .single();

  // Obtener vitrinas con sus sets (solo para saber la cantidad y la portada)
  const { data: vitrinas } = await supabase
    .from('vitrinas')
    .select(`
      id, 
      nombre, 
      visibilidad,
      sets (
        id,
        fotos (
          url
        )
      )
    `)
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: false });

  // Calculate total dynamic bricks
  const setIds = vitrinas?.flatMap(v => v.sets?.map((s: any) => s.id) || []) || [];
  let totalBricks = 0;
  if (setIds.length > 0) {
    const { count } = await supabase
      .from('bricks_recibidos')
      .select('*', { count: 'exact', head: true })
      .in('set_id', setIds);
    totalBricks = count || 0;
  }

  // Merge dynamic count into userProfile
  const profileWithBricks = {
    ...userProfile,
    total_bricks_recibidos: totalBricks
  };

  return <DashboardClient userProfile={profileWithBricks || {}} vitrinas={vitrinas || []} />;
}