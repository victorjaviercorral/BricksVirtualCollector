import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MisVitrinasClient } from "@/components/MisVitrinasClient";
import DondePuedesParticipar from "@/components/DondePuedesParticipar";

export default async function MisVitrinasDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtener vitrinas con sus sets (para saber la cantidad y la portada)
  const { data: vitrinas } = await supabase
    .from('vitrinas')
    .select(`
      id,
      nombre,
      descripcion,
      visibilidad,
      estado,
      creado_en,
      sets (
        id,
        fotos (
          url
        )
      )
    `)
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: false });

  // "Dónde puedes participar": venía del final de "Mi Progreso", donde el usuario está mirando
  // cómo le va y no decidiendo con qué set apuntarse. Aquí tiene sus sets delante.
  const setIds = (vitrinas || []).flatMap((v) => (v.sets || []).map((s: { id: string }) => s.id));

  const [{ data: exposActivas }, { data: bountiesActivos }, misParticipaciones, misReclamos] =
    await Promise.all([
      supabase.from('exposiciones_temporales').select('id, titulo, descripcion').eq('estado', 'activa'),
      supabase.from('bounties').select('*').eq('estado', 'pendiente').limit(8),
      setIds.length > 0
        ? supabase.from('exposicion_sets').select('exposicion_id').in('set_id', setIds)
        : Promise.resolve({ data: [] as { exposicion_id: string }[] }),
      supabase.from('bounties_reclamados').select('bounty_id').eq('usuario_id', user.id),
    ]);

  const yaParticipo = new Set(
    ((misParticipaciones.data as { exposicion_id: string }[] | null) || []).map((p) => p.exposicion_id)
  );
  const yaReclamado = new Set(
    ((misReclamos.data as { bounty_id: string }[] | null) || []).map((r) => r.bounty_id)
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-fluid">
      <DondePuedesParticipar
        exposiciones={(exposActivas || []).filter((e) => !yaParticipo.has(e.id))}
        bounties={(bountiesActivos || []).filter((b) => !yaReclamado.has(b.id))}
      />
      <MisVitrinasClient vitrinas={vitrinas || []} />
    </div>
  );
}
