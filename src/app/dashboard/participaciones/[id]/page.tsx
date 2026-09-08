import { redirect } from "next/navigation";

/**
 * El detalle de un reto reclamado se movió a /dashboard/insignias/bounty/[id] al fusionar
 * "Mi Progreso" en "Mis Insignias": la sección Recompensas es su nueva casa y el detalle cuelga
 * de ella.
 *
 * Se preserva el id en la redirección para que un enlace antiguo lleve al mismo reclamo, no a un
 * listado genérico.
 */
export default async function ParticipacionDetalleRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/insignias/bounty/${id}`);
}
