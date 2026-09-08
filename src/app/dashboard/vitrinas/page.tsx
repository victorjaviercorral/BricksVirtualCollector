import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MisVitrinasClient } from "@/components/MisVitrinasClient";
import DondePuedesParticipar from "@/components/DondePuedesParticipar";
import { temasDeVitrinas } from "@/lib/galeria";

export default async function MisVitrinasDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Obtener vitrinas con sus sets (para saber la cantidad, la portada y las estadísticas de la
  // cabecera). `tematica` se añade al select para poder derivar la lista de temáticas con
  // temasDeVitrinas() -- ya existe en src/lib/galeria.ts, no hace falta reimplementarla.
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
        tematica,
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

  const [{ data: exposActivas }, { data: bountiesActivos }, misParticipaciones, misReclamos, bricksRecibidosRes] =
    await Promise.all([
      supabase.from('exposiciones_temporales').select('id, titulo, descripcion').eq('estado', 'activa'),
      supabase.from('bounties').select('*').eq('estado', 'pendiente').limit(8),
      setIds.length > 0
        ? supabase.from('exposicion_sets').select('exposicion_id').in('set_id', setIds)
        : Promise.resolve({ data: [] as { exposicion_id: string }[] }),
      supabase.from('bounties_reclamados').select('bounty_id').eq('usuario_id', user.id),
      // Bricks recibidos por toda la colección: se cuenta, no se lee de una columna que pueda
      // desviarse -- mismo criterio que Mis Insignias y el Hub (src/lib/insignias-usuario.ts).
      setIds.length > 0
        ? supabase.from('bricks_recibidos').select('*', { count: 'exact', head: true }).in('set_id', setIds)
        : Promise.resolve({ count: 0 }),
    ]);

  const yaParticipo = new Set(
    ((misParticipaciones.data as { exposicion_id: string }[] | null) || []).map((p) => p.exposicion_id)
  );
  const yaReclamado = new Set(
    ((misReclamos.data as { bounty_id: string }[] | null) || []).map((r) => r.bounty_id)
  );

  // Contexto rápido sobre la colección (nuevo): cuántos sets, cuántos bricks ha recibido y en
  // qué temáticas se mueve. Reutiliza lo ya construido para Mis Insignias (mismo criterio de
  // conteo de bricks, mismo componente de tarjeta) en vez de un estilo aparte.
  const statsVitrinas = {
    numSets: setIds.length,
    bricksRecibidos: bricksRecibidosRes.count || 0,
    temas: temasDeVitrinas(vitrinas),
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-fluid pb-20">
      <MisVitrinasClient vitrinas={vitrinas || []} stats={statsVitrinas} />

      {/* "Dónde puedes participar" va DESPUÉS de la rejilla de vitrinas, no antes: es una
          recomendación secundaria ("con lo que ya tienes, esto es lo próximo"), no lo primero
          que se espera ver al entrar en "Mis Vitrinas". El separador evita que quede pegada al
          grid, como pasaba cuando iba arriba del todo. */}
      <div className="mt-16 pt-10 border-t-2 border-foreground/10">
        <DondePuedesParticipar
          exposiciones={(exposActivas || []).filter((e) => !yaParticipo.has(e.id))}
          bounties={(bountiesActivos || []).filter((b) => !yaReclamado.has(b.id))}
        />
      </div>
    </div>
  );
}
