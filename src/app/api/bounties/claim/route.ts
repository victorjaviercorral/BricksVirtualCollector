import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { z } from "zod";

// Límite defensivo sobre el número de bricks que se insertan como recompensa. `recompensa` la
// fija un administrador desde /admin/bounties (no es un input directo del usuario que llama a
// este endpoint), pero acotarlo es una salvaguarda barata contra un valor mal introducido que
// generase un insert masivo desproporcionado.
const MAX_REWARD_BRICKS = 1000;

// Hallazgo S1 (auditoría original): sin validar la forma del payload, un bountyId/setId
// malformado dependía de que Postgres lo rechazara más adelante con un error genérico. Zod lo
// rechaza aquí, antes de tocar la base de datos.
const bodySchema = z.object({
  bountyId: z.string().uuid(),
  setId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }
    const { bountyId, setId } = parsed.data;

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

    // Validate bounty exists and is open to claims
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', bountyId)
      .single();

    if (bountyError || !bounty) {
      return NextResponse.json({ error: 'Bounty no encontrado' }, { status: 404 });
    }

    if (bounty.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Este bounty ya no está activo' }, { status: 400 });
    }

    // Modelo decidido en la Iteración 4 (hallazgo D1): un bounty puede reclamarlo cualquier
    // número de personas, no hay un único ganador que lo bloquee para el resto -- cada reclamo
    // es su propia fila en bounties_reclamados, con la recompensa completa cada vez.
    //
    // La atomicidad frente a un doble clic o dos peticiones concurrentes del mismo usuario no la
    // da ya un UPDATE condicional (no hay una fila de `bounties` que bloquear): la da la
    // constraint unique(bounty_id, usuario_id) de la migración 20260818120000. Si dos peticiones
    // llegan a la vez, una inserta con éxito y la otra recibe 23505 -- el mismo patrón que ya usan
    // bricks_recibidos (unique(set_id, hash_visitante)) y exposicion_sets (unique(exposicion_id,
    // set_id)).
    const rewardBricks = Math.min(bounty.recompensa || 50, MAX_REWARD_BRICKS);

    const { data: reclamo, error: claimError } = await supabase
      .from('bounties_reclamados')
      .insert({
        bounty_id: bountyId,
        usuario_id: user.id,
        set_id: setId,
        nombre_set: bounty.nombre_set,
        recompensa: rewardBricks,
        estado: 'reclamado',
      })
      .select('id')
      .single();

    if (claimError) {
      if (claimError.code === '23505') {
        return NextResponse.json({ error: 'Ya has reclamado este bounty' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Error al registrar el reclamo' }, { status: 500 });
    }

    // Award Bricks to the set
    const inserts = Array.from({ length: rewardBricks }).map((_, i) => ({
      set_id: setId,
      // Usamos un hash único para evitar violar la restricción unique(set_id, hash_visitante)
      hash_visitante: `bounty-${bountyId}-${i}-${crypto.randomUUID()}`
    }));

    // Hallazgo S4: la política RLS de bricks_recibidos para un voto normal de usuario exige
    // hash_visitante = auth.uid() (ver migración 20260901120000) -- correcto para un voto real,
    // pero incompatible con estos hashes sintéticos de recompensa (varios por reclamo, ninguno
    // igual a auth.uid()). El ownership del set y la elegibilidad del bounty ya se han validado
    // arriba con el cliente de sesión normal; esta inserción concreta usa la service_role key
    // (bypassa RLS) -- mismo patrón ya establecido en api/sets/foto/route.ts y
    // api/auth/delete-account/route.ts para operaciones privilegiadas ya verificadas.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY for bounty reward bricks.");
      // El reclamo ya quedó registrado (bounties_reclamados) -- se informa del fallo de
      // recompensa sin revertirlo, mismo criterio que el resto de esta ruta.
    } else {
      const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: insertError } = await supabaseAdmin
        .from('bricks_recibidos')
        .insert(inserts);

      if (insertError) {
        // No hay transacción cross-tabla aquí: el reclamo (bounties_reclamados) ya quedó
        // registrado y no se revierte. Se documenta en vez de fingir atomicidad que no existe --
        // el mismo criterio que ya aplicaba esta ruta antes de esta reescritura.
        console.error("Error al insertar los bricks de recompensa:", insertError);
      }
    }

    return NextResponse.json({ success: true, reward: rewardBricks, reclamoId: reclamo?.id });
  } catch (error) {
    console.error("Error en API bounties claim:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
