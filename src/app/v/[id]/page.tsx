import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { PackageOpen, Map, ArrowRight, Share2 } from "lucide-react";
import { getVitrinaPublicaById } from "@/lib/queries/vitrinas";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const vitrina = await getVitrinaPublicaById(id);

  if (!vitrina) return { title: 'Vitrina no encontrada' };

  const ownerName = (vitrina.usuarios_perfil as any)?.alias || (vitrina.usuarios_perfil as any)?.username || 'Un coleccionista';

  return {
    title: `${vitrina.nombre} | BricksVirtualCollector`,
    description: `Explora la vitrina de ${ownerName}: ${vitrina.descripcion || 'Una colección increíble de sets de Lego.'}`,
    openGraph: {
      title: `${vitrina.nombre} - BricksVirtualCollector`,
      description: `Explora la vitrina de ${ownerName}: ${vitrina.descripcion || 'Una colección increíble de sets de Lego.'}`,
      images: ['https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1200&auto=format&fit=crop'],
    },
  }
}

export default async function PublicVitrinaPage({ params }: Props) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Misma consulta que generateMetadata() de más arriba, cacheada por request (React cache()):
  // esta llamada reutiliza el resultado en vez de generar un segundo round trip a Supabase.
  const vitrina = await getVitrinaPublicaById(id);

  if (!vitrina) {
    notFound();
  }

  // Prevent accessing private vitrinas
  if (vitrina.visibilidad === 'privada') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <PackageOpen size={64} className="text-black/20 mb-6" />
        <h1 className="text-4xl font-display font-bold mb-4">Vitrina Privada</h1>
        <p className="text-lg text-black/60 mb-8 max-w-md">
          El propietario ha decidido mantener esta vitrina en privado.
        </p>
        <Link href="/" className="bg-brand-blue text-white px-8 py-3 rounded-full font-bold hover:opacity-90">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const ownerName = (vitrina.usuarios_perfil as any)?.alias || (vitrina.usuarios_perfil as any)?.username || 'Usuario Anónimo';
  const ownerAvatar = (vitrina.usuarios_perfil as any)?.avatar_url;

  return (
    <div className="flex flex-col gap-10 pb-20 pt-10">
      {/* Header Info */}
      <section className="glass rounded-3xl p-8 sm:p-12 border-l-4 border-l-brand-blue flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            {ownerAvatar ? (
              <img src={ownerAvatar} alt={ownerName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-red flex items-center justify-center text-white font-bold text-sm">
                {ownerName.charAt(0)}
              </div>
            )}
            <span className="text-black/60 font-medium">Colección de <strong className="text-black">{ownerName}</strong></span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold mb-4">{vitrina.nombre}</h1>
          <p className="text-lg text-black/70 max-w-2xl leading-relaxed">
            {vitrina.descripcion || "Esta vitrina no tiene descripción, pero sus sets hablan por sí solos."}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 min-w-[200px]">
          <div className="glass p-4 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-bold text-black/50">Sets</span>
            <span className="text-xl font-display font-bold">{vitrina.sets?.length || 0}</span>
          </div>
          <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-black/5 hover:bg-black/10 font-bold transition-colors">
            <Share2 size={18} /> Compartir
          </button>
        </div>
      </section>

      {/* Sets Grid (Read Only) */}
      <section>
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <PackageOpen className="text-brand-yellow" /> Sets Expuestos
        </h2>
        
        {(!vitrina.sets || vitrina.sets.length === 0) ? (
          <div className="glass rounded-3xl p-12 text-center flex flex-col items-center">
            <PackageOpen size={48} className="text-black/20 mb-4" />
            <h3 className="text-xl font-bold mb-2">Vitrina Vacía</h3>
            <p className="text-black/60">Esta vitrina aún no tiene sets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vitrina.sets.map((set: any) => (
              <div key={set.id} className="glass rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[4/3] bg-black/5 relative overflow-hidden">
                  {set.fotos && set.fotos[0] ? (
                    <img 
                      src={set.fotos[0].url} 
                      alt={set.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/20">
                      <Map size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm">
                      {set.tematica || "Sin temática"}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 leading-tight">{set.nombre}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-mono text-black/60 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-brand-yellow" />
                      {set.num_piezas} pz
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action (Viral Hook) */}
      <section className="mt-12 bg-gradient-to-r from-brand-blue to-brand-red rounded-[2rem] p-10 sm:p-16 text-white text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold mb-6">¿Tú también eres un maestro constructor?</h2>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Únete a nuestra comunidad global. Digitaliza tu colección, recibe recompensas y comparte tus mejores creaciones con el mundo.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl">
            Crear mi Museo Gratis <ArrowRight size={20} />
          </Link>
        </div>
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
      </section>
    </div>
  );
}
