import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getVitrinasPublicas } from "@/lib/queries/vitrinas";

/**
 * Hallazgo E8 del preflight: /sitemap.xml daba 404. Rutas estáticas de "Explorar" (contenido
 * público, ver navegacion-y-flujos.md) más las vitrinas públicas reales, vía la misma
 * `getVitrinasPublicas()` que ya usa /galeria (Zero-Duplication: ninguna consulta nueva).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/galeria`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/bounties`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/exposiciones`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/como-funciona`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/registro`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/politica-privacidad`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/terminos-condiciones`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/politica-cookies`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/aviso-legal`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/politica-propiedad-intelectual`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const vitrinas = await getVitrinasPublicas();
  const dinamicas: MetadataRoute.Sitemap = vitrinas.map((v) => ({
    url: `${SITE_URL}/vitrina/${v.id}`,
    lastModified: v.creado_en ? new Date(v.creado_en) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...estaticas, ...dinamicas];
}
