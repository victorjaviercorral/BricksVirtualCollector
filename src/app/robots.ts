import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Hallazgo E8 del preflight: /robots.txt daba 404. Se indexa el contenido público ("Explorar")
 * y se excluyen las áreas que exigen sesión ("Mi Museo") y el panel de administración -- coherente
 * con `docs/03-diseno/navegacion-y-flujos.md`, que ya distingue esos dos contextos.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/mesa-de-trabajo", "/admin", "/ajustes", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
