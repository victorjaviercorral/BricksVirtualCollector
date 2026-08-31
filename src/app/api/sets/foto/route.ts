import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// ADR-005 (limpieza EXIF/GPS) + ADR-010 (plan de migración a Route Handler, en vez de una
// Supabase Edge Function). Antes, MesaTrabajoClient.tsx limpiaba los metadatos en el propio
// navegador (canvas.toBlob()) y subía directo al bucket con la anon key -- no verificable
// server-side, exactamente lo que ADR-005 exige evitar: un cliente modificado podía saltarse la
// limpieza sin que nada lo impidiera. Este endpoint es el único camino posible para subir una
// foto de set desde ahora (migración 20260901100000 revoca el INSERT directo del cliente al
// bucket fotos_sets), así que la limpieza ya no depende de que el navegador la ejecute de buena
// fe.
//
// Requiere runtime de Node.js -- sharp es un binario nativo, incompatible con el runtime Edge.
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, coincide con el límite ya comunicado al usuario
// en MesaTrabajoClient.tsx y con el file_size_limit documentado para el bucket fotos_sets
// (20260810150000_storage_buckets.sql) -- comprobado también aquí server-side: el límite del
// cliente por sí solo no es una garantía (hallazgo relacionado con S1).

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el fichero de imagen" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "La imagen no debe superar los 10MB" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El fichero debe ser una imagen" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    let cleanedBuffer: Buffer;
    try {
      // sharp no conserva metadatos (EXIF/GPS/ICC/XMP) salvo que se llame a .withMetadata() --
      // no llamarla es, precisamente, la limpieza que exige ADR-005. .rotate() aplica la
      // orientación EXIF a los píxeles antes de descartar el propio EXIF, para que la foto no
      // salga girada al perder esa etiqueta. Se reencodifica siempre a JPEG, mismo criterio que
      // ya usaba processImageToStripExif en el cliente.
      cleanedBuffer = await sharp(inputBuffer).rotate().jpeg({ quality: 90 }).toBuffer();
    } catch (sharpError) {
      console.error("Error al procesar la imagen con sharp:", sharpError);
      return NextResponse.json({ error: "El fichero no es una imagen válida" }, { status: 400 });
    }

    // Cliente admin: la subida real la hace el servidor con la service_role key, no el usuario
    // directamente -- es lo que hace irrelevante que alguien intente saltarse este endpoint,
    // porque el bucket ya no acepta INSERT de authenticated/anon (ver migración 20260901100000).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY for foto upload.");
      return NextResponse.json(
        { error: "El servicio de subida no está configurado correctamente en el servidor." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Mismo esquema de ruta que ya usaba el cliente (userData.user.id + timestamp) -- las
    // políticas de lectura pública de storage.objects para fotos_sets no cambian.
    const fileName = `${user.id}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("fotos_sets")
      .upload(fileName, cleanedBuffer, { contentType: "image/jpeg", upsert: false });

    if (uploadError) {
      console.error("Error al subir la foto limpia:", uploadError);
      return NextResponse.json({ error: "No se pudo subir la foto" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from("fotos_sets").getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("Error inesperado al procesar la foto:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
