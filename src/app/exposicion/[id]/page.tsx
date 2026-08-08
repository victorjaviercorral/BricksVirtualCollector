import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ExposicionClient from "./ExposicionClient";

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

  // 2. Fetch Ranking (Sets Aprobados + Bricks)
  // Necesitamos obtener los sets aprobados y contar los bricks que tienen asociados a ESTA exposición.
  const { data: participaciones } = await supabase
    .from("exposicion_sets")
    .select(`
      id,
      estado,
      set_id,
      sets (
        id,
        nombre,
        num_piezas,
        usuarios_perfil ( username ),
        fotos ( url )
      )
    `)
    .eq("exposicion_id", id)
    .eq("estado", "aprobado");

  // Fetch bricks emitted specifically for this exposicion
  const { data: bricks } = await supabase
    .from("bricks_recibidos")
    .select("set_id")
    .eq("exposicion_id", id);

  // Calculate ranking
  let ranking = [];
  if (participaciones) {
    ranking = participaciones.map((p: any) => {
      const setBricks = bricks?.filter(b => b.set_id === p.set_id).length || 0;
      return {
        ...p.sets,
        votos: setBricks,
        foto_url: p.sets.fotos?.[0]?.url || "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop"
      };
    }).sort((a, b) => b.votos - a.votos); // Sort descending
  }

  // 3. User session for participation
  const { data: { user } } = await supabase.auth.getUser();
  let userSets: any[] = [];
  if (user) {
    // Fetch all user sets for the modal
    const { data: mySets } = await supabase
      .from("sets")
      .select("id, nombre, fotos(url)")
      .eq("usuario_id", user.id);
      
    userSets = mySets || [];

    // Check if user is already participating
    const userSetIds = userSets.map((s: any) => s.id);
    
    // We only need to check participation if the user actually has sets
    if (userSetIds.length > 0) {
      const { data: userParticipation } = await supabase
        .from("exposicion_sets")
        .select("set_id")
        .eq("exposicion_id", id)
        .in("set_id", userSetIds);
        
      // For this particular page, we might want to do something with userParticipation, 
      // but right now it's just fetched and not passed down. Let's make sure it doesn't break.
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <ExposicionClient 
        exposicion={exposicion} 
        ranking={ranking} 
        userSets={userSets} 
        userId={user?.id || null} 
      />
    </div>
  );
}
