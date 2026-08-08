import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Lock, Box, ArrowRight } from "lucide-react";
import BountiesSectionClient from "@/components/BountiesSectionClient";

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch public vitrinas
  const { data: vitrinas } = await supabase
    .from('vitrinas')
    .select(`
      id,
      nombre,
      descripcion,
      usuarios_perfil (username),
      sets (
        id,
        nombre,
        num_piezas,
        tematica,
        fotos (url)
      )
    `)
    .eq('estado', 'publicada')
    .eq('visibilidad', 'pública')
    .limit(4);

  // Fetch active Exposición Temporal
  const { data: exposicion } = await supabase
    .from('exposiciones_temporales')
    .select('*')
    .eq('estado', 'activa')
    .order('creado_en', { ascending: false })
    .limit(1)
    .single();

  // Fetch bounties
  const { data: bounties } = await supabase
    .from('bounties')
    .select('*')
    .eq('estado', 'pendiente')
    .limit(3);

  // Calculate total bounty points
  const totalBountyPts = bounties?.reduce((acc, curr) => acc + curr.recompensa, 0) || 0;

  return (
    <div className="space-y-12 pb-12 overflow-x-hidden">
      
      {/* 0. Exposición Temporal (Event Banner) */}
      {exposicion && (
        <Link href={`/exposicion/${exposicion.id}`} className="block relative w-full h-[300px] sm:h-[400px] rounded-[2.5rem] overflow-hidden border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] dark:shadow-[8px_8px_0px_0px_#F8F9FA] flex items-end p-8 group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_#0F172A] dark:hover:shadow-[10px_10px_0px_0px_#F8F9FA] transition-all">
           <img src={exposicion.imagen_url} alt={exposicion.titulo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
           
           <div className="relative z-10 text-white w-full max-w-2xl">
              <div className="bg-brand-yellow text-black font-black text-xs px-3 py-1 rounded-full border-2 border-black inline-block mb-4 uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                Exposición Temporal Activa
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-black leading-tight mb-2">{exposicion.titulo}</h2>
              <p className="text-white/80 font-medium text-lg mb-4">{exposicion.descripcion}</p>
              <div className="inline-block bg-white text-black font-black px-6 py-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">Ver Detalles y Participar &rarr;</div>
           </div>
        </Link>
      )}
      {/* 1. Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="order-2 lg:order-1 space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-tight text-foreground tracking-tight">
            Eleva tu colección a otro nivel
          </h1>
          <p className="text-lg text-foreground/80 max-w-lg">
            Digitaliza tus modelos físicos en una vitrina 3D interactiva. Colecciona, exhibe y comparte tus construcciones con la comunidad.
          </p>
          <Link href="/dashboard" className="inline-block bg-brand-blue text-white font-bold text-base px-6 py-3 rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] dark:hover:shadow-[6px_6px_0px_0px_#F8F9FA] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0px_0px_0px_0px_#0F172A] dark:active:shadow-[0px_0px_0px_0px_#F8F9FA] transition-all w-full sm:w-auto text-center">
            Empezar a Coleccionar
          </Link>
        </div>
        <div className="order-1 lg:order-2 bg-brand-red rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-8 relative overflow-hidden aspect-square flex items-center justify-center">
          {/* Subtle dots pattern */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(circle_at_center,_var(--foreground)_2px,_transparent_2px)] bg-[length:24px_24px]" />
          <img 
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4ZWkmZe7Qiu7TMXDL3T8w5KQF7lK6hFFxt3t7GAXsiBZ3QXKLRf3BSgd2qO485T5PYI-JSPPaJmjGOreiGcKJI_Amy-iT9RRKMRo903D1i6ZP6gOTUt9UjALT9tfPE5Tp4HtfoDzJ69ggSFfmDc6-bN__LcqPqDxyNklPpLk-PiogCmcyYalMjZfRAqUXVBeTkF1hUXIfHtOZ5QPe6bIEJnJZCz7ldB4M5QGUgVDrOxqdOEAAf0Ahuw" 
            alt="Hero Spaceship" 
          />
        </div>
      </section>

      {/* 2. Stats / Bounties Banner */}
      <section className="bg-brand-yellow rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-6 lg:p-10 flex flex-col lg:flex-row justify-between items-center gap-8 text-center lg:text-left">
        <div className="flex-1">
          <h2 className="text-3xl font-display font-black text-black leading-tight">Bounties Comunitarios</h2>
          <p className="text-black/80 mt-2 font-bold text-base max-w-md">La comunidad necesita documentar estos sets. ¡Súbelos a tu vitrina y gana puntos masivos esta semana!</p>
          <div className="inline-block mt-4 text-4xl md:text-5xl font-display font-black text-foreground bg-panel px-6 py-3 rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] rotate-2">
            {totalBountyPts.toLocaleString()} <span className="text-brand-red text-2xl">pts</span>
          </div>
        </div>
        
        <div className="w-full lg:w-1/2 flex flex-col gap-3">
            <BountiesSectionClient bounties={bounties || []} />
        </div>
      </section>

      {/* 3. Bento Grid Features */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Feature 1: Privacy */}
        <div className="md:col-span-8 bg-brand-blue rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-8 flex flex-col justify-between overflow-hidden relative group min-h-[250px]">
          <div className="relative z-10 space-y-3 max-w-sm">
            <span className="bg-panel text-foreground font-bold text-xs px-3 py-1 rounded-full border-2 border-foreground inline-block">
              Privacidad
            </span>
            <h3 className="text-3xl font-display font-bold text-white leading-tight">Tú tienes el control total</h3>
            <p className="text-base text-white/90">Decide quién puede ver tus colecciones. Mantén tu vitrina privada o compártela públicamente con la comunidad.</p>
          </div>
          <Lock className="absolute -bottom-8 -right-8 w-56 h-56 text-white opacity-20 group-hover:scale-110 transition-transform duration-500" />
        </div>

        {/* Feature 2: Organization */}
        <div className="md:col-span-4 bg-panel rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-8 flex flex-col justify-between min-h-[250px]">
          <div className="space-y-3">
            <span className="bg-brand-yellow text-black font-bold text-xs px-3 py-1 rounded-full border-2 border-foreground inline-block">
              Organización
            </span>
            <h3 className="text-2xl font-display font-bold text-foreground">Tags & Categorías</h3>
            <p className="text-foreground/80 text-sm">Clasifica tus modelos por temática, año o dificultad. Encuentra cualquier pieza en segundos.</p>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            <span className="bg-brand-red text-white text-xs px-2 py-1 rounded-md border-2 border-foreground font-bold">Space</span>
            <span className="bg-brand-blue text-white text-xs px-2 py-1 rounded-md border-2 border-foreground font-bold">Technic</span>
            <span className="bg-brand-yellow text-black text-xs px-2 py-1 rounded-md border-2 border-foreground font-bold">Creator</span>
          </div>
        </div>

        {/* Feature 3: Analytics */}
        <div className="md:col-span-5 bg-brand-red rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-8 flex flex-col justify-between min-h-[200px]">
          <div className="space-y-3">
            <h3 className="text-2xl font-display font-bold text-white">Estadísticas Detalladas</h3>
            <p className="text-white/90 text-sm">Conoce el valor de tu colección, número total de piezas y el tiempo estimado de construcción.</p>
          </div>
          <div className="mt-6">
            <div className="h-4 bg-panel rounded-full border-2 border-foreground overflow-hidden flex">
              <div className="w-1/2 bg-brand-blue border-r-2 border-foreground"></div>
              <div className="w-1/3 bg-brand-yellow border-r-2 border-foreground"></div>
            </div>
          </div>
        </div>

        {/* Feature 4: 3D View */}
        <div className="md:col-span-7 bg-panel rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-8 flex flex-col justify-between relative overflow-hidden group cursor-pointer min-h-[200px]">
          <div className="relative z-10 space-y-3 max-w-sm">
            <span className="bg-brand-blue text-white font-bold text-xs px-3 py-1 rounded-full border-2 border-foreground inline-block">
              Interactividad
            </span>
            <h3 className="text-3xl font-display font-bold text-foreground">Explorador Virtual</h3>
            <p className="text-foreground/80 text-sm">Visualiza tus modelos en un entorno detallado. Gira, acerca y explora cada detalle.</p>
          </div>
          <div className="absolute right-0 bottom-0 w-40 h-40 bg-foreground/5 dark:bg-foreground/10 rounded-tl-[3rem] border-l-2 border-t-2 border-foreground flex items-center justify-center translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300">
            <Box className="w-16 h-16 text-brand-blue" />
          </div>
        </div>
      </section>

      {/* 4. Featured Showcases Gallery */}
      <section className="space-y-6 pt-4">
        <div className="flex justify-between items-end border-b-2 border-foreground pb-4">
          <h2 className="text-3xl font-display font-bold text-foreground">Vitrinas Destacadas</h2>
          <Link href="/dashboard" className="hidden sm:flex font-bold text-brand-blue items-center gap-2 hover:underline text-sm">
            Ver Galería Completa <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vitrinas?.map((vitrina, i) => {
            const coverUrl = vitrina.sets?.[0]?.fotos?.[0]?.url || "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop";
            const bgColors = ["bg-brand-blue", "bg-brand-yellow", "bg-brand-red", "bg-brand-green"];
            const cardBg = bgColors[i % bgColors.length];
            
            return (
              <Link key={vitrina.id} href={`/vitrina/${vitrina.id}`} className="bg-panel rounded-2xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] overflow-hidden group cursor-pointer flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0F172A] dark:hover:shadow-[6px_6px_0px_0px_#F8F9FA] transition-all">
                <div className={`h-40 ${cardBg} relative border-b-2 border-foreground overflow-hidden p-4 flex items-center justify-center`}>
                  <img 
                    src={coverUrl} 
                    alt={vitrina.nombre}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500 rounded-xl border-2 border-transparent"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-display font-bold text-foreground line-clamp-1">{vitrina.nombre}</h4>
                    <p className="font-mono text-xs text-foreground/60 mt-1">Por @{(vitrina.usuarios_perfil as any)?.username || 'Coleccionista'}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                     <span className="text-xs font-bold px-2 py-1 bg-foreground/5 dark:bg-foreground/10 rounded border border-foreground uppercase">
                       {vitrina.sets?.length || 0} Sets
                     </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
      
    </div>
  );
}