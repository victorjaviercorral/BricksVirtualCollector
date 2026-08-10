import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParticipacionesDetailClient from './ParticipacionesDetailClient'

export default async function ParticipacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtenemos los detalles de la participación (puede ser bounty o exposición, simplificado a bounties para el MVP)
  // Intentamos buscar en bounties primero (como ejemplo)
  const { data: bountyData } = await supabase
    .from('bounties_reclamados')
    .select(`
      *,
      bounties (*)
    `)
    .eq('id', id)
    .single();

  let participacion = null;
  let tipo = 'bounty';

  if (bountyData) {
    participacion = {
      id: bountyData.id,
      titulo: bountyData.nombre_set,
      descripcion: bountyData.descripcion || bountyData.bounties?.descripcion || "Descripción detallada del reto.",
      recompensa: bountyData.recompensa,
      estado: 'pendiente', // Mocked para el ejemplo visual
      progreso: 66,
      requisitos: [
        { id: 1, texto: "Sets oficiales de Lego" },
        { id: 2, texto: "Fotos claras y bien iluminadas" },
        { id: 3, texto: "Sin modificaciones de MOCs" }
      ],
      tareas: [
        { id: 1, texto: "Set #10297", estado: 'aprobado' },
        { id: 2, texto: "Set #10260", estado: 'pendiente' },
        { id: 3, texto: "Set #10326", estado: 'pendiente' }
      ]
    };
  } else {
    // Para no romper la demo si el ID no existe en bounties, mockeamos un "Modular Master" genérico
    participacion = {
      id: id,
      titulo: "Modular Master",
      descripcion: "Sube fotos de 3 sets modulares diferentes",
      recompensa: 500,
      estado: 'en_progreso',
      progreso: 66,
      requisitos: [
        { id: 1, texto: "Sets oficiales de Lego" },
        { id: 2, texto: "Fotos claras y bien iluminadas" },
        { id: 3, texto: "Sin modificaciones de MOCs" }
      ],
      tareas: [
        { id: 1, texto: "Set #10297", estado: 'aprobado' },
        { id: 2, texto: "Set #10260", estado: 'pendiente' },
        { id: 3, texto: "Set #10326", estado: 'pendiente' }
      ]
    };
  }

  return <ParticipacionesDetailClient participacion={participacion} />
}
