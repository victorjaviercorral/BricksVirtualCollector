// Edge Function purgar-ficheros-invitados (incidente CI-2026-004).
//
// La invoca el job de pg_cron `borrar-ficheros-invitados` (vía pg_net) con la cabecera
// `x-purga-token`, que se valida contra Vault con la RPC validar_token_purga_ficheros (solo
// service_role). Desplegar con verify_jwt = false (ver supabase/config.toml): la autenticación es el
// token, no un JWT. SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase en el runtime.
import { createClient } from "npm:@supabase/supabase-js@2";
import { borrarFicherosPendientes, type OperacionesBorrado } from "./borrado.ts";

const COLA = "storage_borrados_pendientes";

function json(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json({ error: "Función mal configurada" }, 500);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = req.headers.get("x-purga-token") ?? "";
  const { data: valido, error: errorToken } = await admin.rpc("validar_token_purga_ficheros", {
    p_token: token,
  });
  if (errorToken) {
    console.error("No se pudo validar el token:", errorToken.message);
    return json({ error: "No se pudo validar el token" }, 500);
  }
  if (valido !== true) return json({ error: "No autorizado" }, 401);

  const op: OperacionesBorrado = {
    async leerPendientes(limite, despuesDeId) {
      const { data, error } = await admin
        .from(COLA)
        .select("id, bucket_id, ruta")
        .gt("id", despuesDeId)
        .order("id", { ascending: true })
        .limit(limite);
      if (error) throw new Error(`Leyendo la cola: ${error.message}`);
      return data ?? [];
    },
    async borrarFicheros(bucket, rutas) {
      const { error } = await admin.storage.from(bucket).remove(rutas);
      return error ? error.message : null;
    },
    async marcarHechos(ids) {
      const { error } = await admin.from(COLA).delete().in("id", ids);
      if (error) throw new Error(`Vaciando la cola: ${error.message}`);
    },
    async marcarFallidos(ids, mensaje) {
      const { error } = await admin
        .from(COLA)
        .update({ ultimo_error: mensaje, ultimo_intento_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw new Error(`Anotando el error: ${error.message}`);
    },
  };

  try {
    const resumen = await borrarFicherosPendientes(op);
    if (resumen.fallidos > 0) console.error("Borrado parcial:", resumen.errores);
    return json(resumen, resumen.fallidos > 0 ? 500 : 200);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    console.error("Error en el borrado de ficheros:", mensaje);
    return json({ error: mensaje }, 500);
  }
});
