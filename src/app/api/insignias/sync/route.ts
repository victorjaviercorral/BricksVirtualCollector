import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getDatosInsignias } from "@/lib/queries/insignias-usuario";
import { CATALOGO_POR_SLUG, slugsDesbloqueados } from "@/lib/insignias-usuario";

/**
 * Persiste en `insignias_usuario` las insignias que el usuario ya tiene desbloqueadas y devuelve
 * únicamente las que se han registrado AHORA -- es decir, las que acaba de conseguir.
 *
 * Por qué existe (decisión del titular, modelo híbrido): el catálogo se calcula al vuelo en cada
 * carga y por tanto nunca puede quedar desincronizado de los datos reales; lo que el cálculo no
 * puede dar por sí solo es la FECHA en que se consiguió algo ni el momento de "acabas de
 * desbloquear". Eso lo aporta esta tabla.
 *
 * **El servidor recalcula; no se fía del cliente.** El cuerpo de la petición se ignora por
 * completo: si esta ruta insertara la lista que le mandan, cualquiera podría concederse la
 * Triple Corona con un `fetch`. Se vuelven a leer los datos del usuario y se evalúa el catálogo
 * aquí. Por eso tampoco hace falta validar un payload con Zod (patrón de api/bricks/route.ts):
 * no hay payload.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Debes iniciar sesión." }, { status: 401 });
    }

    const { data: perfil } = await supabase
      .from("usuarios_perfil")
      .select("creado_en")
      .eq("id", user.id)
      .single();

    const { agregados } = await getDatosInsignias(supabase, user.id, perfil?.creado_en || user.created_at);
    const desbloqueadas = slugsDesbloqueados(agregados);

    if (desbloqueadas.length === 0) {
      return NextResponse.json({ nuevas: [] });
    }

    // Cinturón y tirantes: aunque los slugs los produce el propio catálogo, se filtran contra él
    // antes de escribir. Una insignia retirada del catálogo en el futuro no debe poder colarse en
    // la tabla por un despiste de refactor.
    const filas = desbloqueadas
      .filter((insignia) => CATALOGO_POR_SLUG[insignia])
      .map((insignia) => ({ usuario_id: user.id, insignia }));

    // `ignoreDuplicates` sobre unique(usuario_id, insignia) hace el INSERT idempotente: recargar
    // la página no reescribe nada, así que `otorgado_en` conserva la fecha del primer día. Y el
    // .select() devuelve solo las filas realmente insertadas -- justo lo que necesita el aviso de
    // "has desbloqueado X".
    const { data: insertadas, error } = await supabase
      .from("insignias_usuario")
      .upsert(filas, { onConflict: "usuario_id,insignia", ignoreDuplicates: true })
      .select("insignia");

    if (error) {
      // No se propaga como fallo de la página: la Vitrina ya se está pintando con el cálculo al
      // vuelo, que es la fuente de verdad. Perder la persistencia solo cuesta la fecha y el aviso.
      console.error("Error al registrar insignias:", error);
      return NextResponse.json({ error: "No se pudieron registrar las insignias" }, { status: 500 });
    }

    return NextResponse.json({ nuevas: (insertadas || []).map((f) => f.insignia) });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
