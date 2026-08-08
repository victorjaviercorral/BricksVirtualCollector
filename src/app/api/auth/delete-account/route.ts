import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Verify the user session using the standard server client
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY for account deletion.");
      return NextResponse.json(
        { error: "El servicio de borrado no está configurado correctamente en el servidor." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. Delete the user (this cascades to usuarios_perfil, vitrinas, sets, fotos thanks to ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json({ error: "No se pudo eliminar la cuenta." }, { status: 500 });
    }

    // Return success. The client should then sign out to clear local session.
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error("Unexpected error deleting account:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
