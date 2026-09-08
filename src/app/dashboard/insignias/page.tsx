import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InsigniasClient from "@/components/badges/InsigniasClient";
import { getDatosInsignias, getMosaicoComunitario } from "@/lib/queries/insignias-usuario";
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
  // repartía insignias todavía. Ahora todo sale de datos reales: los sellos del Pasaporte de
  // sets_insignias, las recompensas de bounties_reclamados y las insignias de usuario del motor
  // de src/lib/insignias-usuario.ts evaluado contra los agregados de la cuenta.
  const { insigniasDeSets, agregados } = await getDatosInsignias(
    supabase,
    user.id,
    userProfile?.creado_en || user.created_at
  );

  const insignias = evaluarInsignias(agregados);

  // Mosaico Comunitario: los hitos de TODA la comunidad, no solo los del usuario.
  const mosaico = await getMosaicoComunitario(supabase, user.id);

  return (
    <InsigniasClient
      userProfile={userProfile || {}}
      user={user}
      misInsignias={insigniasDeSets}
      agregados={agregados}
      insignias={insignias}
      mosaico={mosaico}
    />
  );
}
