import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Hallazgo E6 del preflight (docs/09-lanzamiento/preflight-2026-09-21.md): la Política de
 * Privacidad promete el derecho de portabilidad, pero solo se atendía a mano por el canal de
 * contacto. Este endpoint lo hace self-service, sin service_role: usa la sesión del propio
 * usuario, así que la RLS de cada tabla ("el usuario ve sus propios...") es la que decide qué
 * sale -- ni siquiera un bug aquí podría filtrar datos de otra cuenta.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [perfil, vitrinas, bricksDados, reclamos, insignias] = await Promise.all([
      supabase.from("usuarios_perfil").select("*").eq("id", user.id).single(),
      supabase.from("vitrinas").select("*, sets(*, fotos(url, orden))").eq("usuario_id", user.id),
      supabase.from("bricks_recibidos").select("set_id, creado_en").eq("hash_visitante", user.id),
      supabase.from("bounties_reclamados").select("*").eq("usuario_id", user.id),
      supabase.from("insignias_usuario").select("insignia, otorgado_en").eq("usuario_id", user.id),
    ]);

    const payload = {
      exportado_en: new Date().toISOString(),
      nota: "Exportación de datos personales de BricksVirtualCollector (derecho de portabilidad, Política de Privacidad §5).",
      perfil: perfil.data,
      vitrinas: vitrinas.data ?? [],
      bricks_dados_a_otros_sets: bricksDados.data ?? [],
      bounties_reclamados: reclamos.data ?? [],
      insignias_desbloqueadas: insignias.data ?? [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="bricksvirtualcollector-mis-datos.json"`,
      },
    });
  } catch (err) {
    console.error("Error inesperado al exportar los datos del usuario:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
