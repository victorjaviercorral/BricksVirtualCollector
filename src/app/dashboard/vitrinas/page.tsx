import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MisVitrinasClient } from "@/components/MisVitrinasClient";

export default async function MisVitrinasDashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtener vitrinas con sus sets (para saber la cantidad y la portada)
  const { data: vitrinas } = await supabase
    .from('vitrinas')
    .select(`
      id, 
      nombre,
      descripcion, 
      visibilidad,
      estado,
      creado_en,
      sets (
        id,
        fotos (
          url
        )
      )
    `)
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: false });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-fluid">
      <MisVitrinasClient vitrinas={vitrinas || []} />
    </div>
  );
}
