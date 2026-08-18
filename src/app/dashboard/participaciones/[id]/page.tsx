import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import ParticipacionesDetailClient from './ParticipacionesDetailClient'

export default async function ParticipacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Hallazgo R3 cerrado (Iteración 4): antes, si el id no existía en bounties_reclamados, esta
  // página mostraba un "Modular Master" ficticio en vez de un 404 -- posible porque, hasta
  // entonces, ningún flujo real escribía en esa tabla (hallazgo N8). Ahora que
  // api/bounties/claim/route.ts sí la escribe (modelo multi-reclamo, D1), esta consulta
  // devuelve datos reales, y cuando no encuentra nada es porque de verdad no existe.
  //
  // El filtro por usuario_id es cinturón y tirantes: la política RLS "El usuario ve sus propios
  // reclamos" ya lo garantiza, pero se repite aquí explícitamente para que el código no dependa
  // en silencio de la política vigente (mismo criterio que perfil/[id]/page.tsx).
  const { data: reclamo } = await supabase
    .from('bounties_reclamados')
    .select(`
      id,
      nombre_set,
      recompensa,
      estado,
      creado_en,
      bounties ( tematica ),
      sets ( id, nombre )
    `)
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (!reclamo) {
    notFound()
  }

  // Sin tipos generados de Supabase (bloqueado por A1, ver ADR-010), el cliente infiere las
  // relaciones foráneas como array salvo que se declaren explícitamente. En runtime esta
  // relación es siempre un único objeto -- mismo patrón que SetDetailClient.tsx.
  const bountyInfo = Array.isArray(reclamo.bounties) ? reclamo.bounties[0] : reclamo.bounties
  const set = Array.isArray(reclamo.sets) ? reclamo.sets[0] : reclamo.sets

  const participacion = {
    id: reclamo.id,
    nombreSet: reclamo.nombre_set,
    tematica: bountyInfo?.tematica ?? null,
    recompensa: reclamo.recompensa,
    estado: reclamo.estado,
    fechaReclamo: reclamo.creado_en,
    set: set ? { id: set.id, nombre: set.nombre } : null,
  }

  return <ParticipacionesDetailClient participacion={participacion} />
}
