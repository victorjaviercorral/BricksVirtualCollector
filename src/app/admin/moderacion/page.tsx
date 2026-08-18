import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { approveAction, rejectAction } from "./actions";
import { isModeratorRole } from "@/lib/roles";

export default async function ModeracionPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("usuarios_perfil")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isModeratorRole(profile?.role)) {
    redirect("/");
  }

  // Fetch pending submissions
  const { data: pendientes } = await supabase
    .from("exposicion_sets")
    .select(`
      id,
      creado_en,
      sets ( id, nombre, fotos ( url ), usuarios_perfil ( alias ) ),
      exposiciones_temporales ( id, titulo )
    `)
    .eq("estado", "pendiente")
    .order("creado_en", { ascending: false });

  // Inline server actions for approve/reject have been moved to actions.ts

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display font-black text-3xl mb-1">Moderación de Exposiciones</h1>
          <p className="text-foreground/70 font-bold">Aprueba o rechaza los sets enviados por los usuarios a las exposiciones activas.</p>
        </div>
        <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0 border-2 border-brand-blue">
          <ShieldCheck size={24} />
        </div>
      </div>

      <div className="bg-panel rounded-3xl border-2 border-foreground shadow-[8px_8px_0px_0px_#0F172A] p-6 lg:p-8 min-h-[400px]">
        {pendientes && pendientes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendientes.map((item: any) => (
              <div key={item.id} className="border-2 border-foreground rounded-2xl overflow-hidden flex flex-col bg-background relative group">
                <div className="absolute top-2 right-2 bg-brand-yellow px-2 py-1 rounded text-[10px] font-black uppercase z-10 border-2 border-foreground shadow-sm">
                  Pendiente
                </div>
                
                <div className="h-48 bg-black/5 relative">
                  {item.sets?.fotos?.[0]?.url ? (
                    <img src={item.sets.fotos[0].url} alt={item.sets.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20 font-bold">Sin foto</div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-black text-lg leading-tight mb-1">{item.sets?.nombre}</h3>
                  <p className="text-sm font-bold text-foreground/60">Enviado por: {item.sets?.usuarios_perfil?.alias || "Anónimo"}</p>
                  
                  <div className="mt-4 pt-4 border-t-2 border-foreground/10 flex-1">
                    <p className="text-xs uppercase tracking-widest text-foreground/50 font-bold mb-1">Para Exposición:</p>
                    <p className="font-bold">{item.exposiciones_temporales?.titulo}</p>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <form action={approveAction} className="flex-1">
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="w-full bg-brand-green hover:bg-brand-green/80 text-white font-black py-2 rounded-xl flex items-center justify-center gap-2 transition-colors border-2 border-foreground">
                        <CheckCircle2 size={18} /> Aprobar
                      </button>
                    </form>
                    <form action={rejectAction} className="flex-1">
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="w-full bg-brand-red hover:bg-brand-red/80 text-white font-black py-2 rounded-xl flex items-center justify-center gap-2 transition-colors border-2 border-foreground">
                        <XCircle size={18} /> Rechazar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <ShieldCheck size={64} className="text-foreground/20 mb-4" />
            <h3 className="text-2xl font-black mb-2">Todo al día</h3>
            <p className="text-foreground/60 font-bold max-w-md">No hay ninguna solicitud de participación pendiente de moderación en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
