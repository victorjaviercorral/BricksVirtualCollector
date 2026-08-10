import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Límite defensivo sobre el número de bricks que se insertan como recompensa. `recompensa` la
// fija un administrador desde /admin/bounties (no es un input directo del usuario que llama a
// este endpoint), pero acotarlo es una salvaguarda barata contra un valor mal introducido que
// generase un insert masivo desproporcionado.
const MAX_REWARD_BRICKS = 1000;

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

    // Verificar que el set pertenece a quien reclama (hallazgo S3 de la auditoría: antes
    // cualquier usuario autenticado podía premiar el set de otro pasando su id).
    const { data: set, error: setError } = await supabase
      .from('sets')
      .select('id')
      .eq('id', setId)
      .eq('usuario_id', user.id)
      .single();

    if (setError || !set) {
      return NextResponse.json({ error: 'El set no existe o no te pertenece' }, { status: 403 });
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

    // 1. Mark bounty as claimed -- de forma atómica: el .eq('estado', 'pendiente') adicional
    // hace que el UPDATE solo afecte a una fila si SIGUE pendiente en el momento exacto de
    // escribir, cerrando la ventana de carrera (TOCTOU) entre la comprobación de arriba y este
    // update. Dos peticiones concurrentes para el mismo bounty ya no pueden reclamarlo ambas.
    const { data: updatedRows, error: updateError } = await supabase
      .from('bounties')
      .update({
        estado: 'reclamado',
        reclamado_por: user.id
      })
      .eq('id', bountyId)
      .eq('estado', 'pendiente')
      .select();

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el bounty' }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      // Alguien más lo reclamó entre la comprobación y este update.
      return NextResponse.json({ error: 'El bounty ya fue reclamado' }, { status: 400 });
    }

    // 2. Award Bricks to the set
    // Generamos los inserts masivos
    const rewardBricks = Math.min(bounty.recompensa || 50, MAX_REWARD_BRICKS);
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
