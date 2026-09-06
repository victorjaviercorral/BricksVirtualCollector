import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Hallazgo S1 (auditoría original): sin validar la forma del payload, un cuerpo malformado
// dependía de que Postgres lo rechazara más adelante en el flujo con un error genérico. Zod lo
// rechaza aquí, antes de tocar la base de datos, con un mensaje claro.
const bodySchema = z.object({
  set_id: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Debes iniciar sesión." }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "set_id debe ser un identificador válido" }, { status: 400 });
    }
    const { set_id } = parsed.data;

    // Use user.id as the unique identifier for the vote
    // Insert into bricks_recibidos (DB trigger will increment totals)
    const { error } = await supabase
      .from("bricks_recibidos")
      .insert({
        set_id,
        hash_visitante: user.id, // Reusing this column for the user ID to maintain the unique constraint
      });

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: "Ya has dado un Brick a este set" }, { status: 400 });
      }
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Error al dar Brick" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
