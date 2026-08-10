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

  // Aquí irían futuras consultas para Bounties y Exposiciones,
  // por ahora lo pasamos vacío o simulado.

  return <InsigniasClient userProfile={userProfile || {}} user={user} />;
}
