import { redirect } from "next/navigation";

/**
 * "Mi Progreso" se fusionó en "Mis Insignias" (/dashboard/insignias).
 *
 * Las dos pantallas mostraban lo mismo -- cabecera con avatar, estadísticas del usuario y su
 * actividad -- con dos entradas de navbar distintas, que es exactamente la duplicación que
 * prohíbe la regla 2 de AGENTS.md. Todo el contenido vive ahora en secciones de "Mis Insignias":
 * la actividad en curso en #en-curso y las recompensas de retos en #recompensas.
 *
 * Esta ruta se conserva como redirección en vez de borrarse: estuvo enlazada desde la home, el
 * Hub y la navbar durante varias iteraciones y puede estar en marcadores. Un 404 sería una
 * regresión gratuita.
 */
export default async function ParticipacionesRedirectPage() {
  redirect("/dashboard/insignias");
}
