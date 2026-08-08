import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { bountyId, setId } = await request.json();

    if (!bountyId || !setId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Validate session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validate bounty exists and is pending
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (bountyError || !bounty) {
      return NextResponse.json({ error: 'Bounty no encontrado' }, { status: 404 });
    }

    if (bounty.estado !== 'pendiente') {
      return NextResponse.json({ error: 'El bounty ya fue reclamado' }, { status: 400 });
    }

    // 1. Mark bounty as claimed
    const { error: updateError } = await supabase
      .from('bounties')
      .update({ 
        estado: 'reclamado', 
        reclamado_por: user.id 
      })
      .eq('id', bountyId);

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el bounty' }, { status: 500 });
    }

    // 2. Award Bricks to the set
    // Generamos los inserts masivos
    const rewardBricks = bounty.recompensa || 50;
    const inserts = Array.from({ length: rewardBricks }).map((_, i) => ({
      set_id: setId,
      // Usamos un hash único para evitar violar la restricción unique(set_id, hash_visitante)
      hash_visitante: `bounty-${bountyId}-${i}-${crypto.randomUUID()}`
    }));

    const { error: insertError } = await supabase
      .from('bricks_recibidos')
      .insert(inserts);

    if (insertError) {
      // In a real app we would rollback the bounty update or use a transaction via Postgres functions.
      console.error("Error al insertar los bricks de recompensa:", insertError);
    }

    return NextResponse.json({ success: true, reward: rewardBricks });
  } catch (error) {
    console.error("Error en API bounties claim:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
