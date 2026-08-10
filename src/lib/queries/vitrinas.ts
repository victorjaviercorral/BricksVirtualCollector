import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Capa de acceso a datos para vitrinas públicas.
 *
 * Nace de un caso concreto de duplicación (hallazgo E3 / F2.9 de docs/auditoria-arquitectura.md):
 * en src/app/v/[id]/page.tsx, `generateMetadata()` y el componente de página son dos funciones
 * del ciclo de vida de Next.js que se ejecutan por separado para la misma petición, y cada una
 * hacía su propia consulta a Supabase para la misma vitrina -- dos round trips por cada visita a
 * una vitrina pública, con dos formas de `select` ligeramente distintas que podían divergir con
 * el tiempo (como ya ocurrió una vez con `created_at` vs `creado_en`, hallazgo A5).
 *
 * `getVitrinaPublicaById` se envuelve en `cache()` de React: dentro de una misma petición de
 * servidor, la segunda llamada con el mismo `id` reutiliza el resultado de la primera en vez de
 * volver a golpear la base de datos. No es una caché entre peticiones (cada visita nueva sigue
 * consultando Supabase); es exactamente el mecanismo que Next.js recomienda para este patrón.
 */
export const getVitrinaPublicaById = cache(async (id: string) => {
  const supabase = await createClient();

  const { data: vitrina, error } = await supabase
    .from("vitrinas")
    .select(
      `
      *,
      usuarios_perfil (
        username,
        alias,
        avatar_url
      ),
      sets (
        id,
        nombre,
        num_piezas,
        tematica,
        fotos (
          url
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return vitrina;
});
