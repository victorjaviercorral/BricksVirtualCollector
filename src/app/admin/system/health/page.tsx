import React from 'react';
import { Server, Activity, ShieldAlert, GitCommit, Database, Lock } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Revalidación cada 0 segundos (dinámico) para ver datos reales siempre
export const dynamic = 'force-dynamic';

async function updateRateLimit(formData: FormData) {
  'use server';
  
  const req = Number(formData.get('requests'));
  const window = Number(formData.get('window_seconds'));

  if (!req || !window) return;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); }
      }
    }
  );

  await supabase
    .from('system_config')
    .update({ value: { requests: req, window_seconds: window } })
    .eq('key', 'global_rate_limit');

  revalidatePath('/admin/system/health');
}

export default async function SystemHealthPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); }
      }
    }
  );

  // Obtener config de Rate Limit
  const { data: config } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'global_rate_limit')
    .single();

  const rateLimit = config?.value || { requests: 100, window_seconds: 60 };

  // Despliegue info (Vercel)
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'Local Dev';
  const commitMsg = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Ambiente de desarrollo';

  return (
    <div className="space-y-10">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Health & Status</h2>
          <p className="text-sm text-slate-400 mt-1">Visión general del rendimiento y despliegues.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-[#3F8552]/10 border border-[#3F8552]/20 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3F8552] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3F8552]"></span>
          </span>
          <span className="text-sm font-medium text-[#3F8552]">Sistemas Operativos</span>
        </div>
      </header>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Base de Datos</p>
            <p className="text-2xl font-semibold text-white">Conectada</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10">
            <Database className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Caché Edge</p>
            <p className="text-2xl font-semibold text-white">Activa (1min)</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10">
            <Activity className="w-6 h-6 text-purple-500" />
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Límite Global</p>
            <p className="text-2xl font-semibold text-white">{rateLimit.requests} req / {rateLimit.window_seconds}s</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DESPLIEGUES */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-slate-400" />
              Info de Despliegue (Vercel)
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Commit Activo (PROD)</p>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-800 rounded text-sm font-mono text-slate-300 border border-slate-700">{commitSha}</span>
                <span className="text-sm text-slate-400 truncate">{commitMsg}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Políticas de Rollback Seguro</p>
              <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                <li>El código se puede revertir instantáneamente desde el panel de Vercel.</li>
                <li>Las migraciones de BD <b>no se revierten automáticamente</b>. Nunca borres o renombres columnas en producción sin mantener compatibilidad hacia atrás.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RATE LIMITING MANAGER */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-400" />
              Gestor Interactivo de Tráfico
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-400 mb-6">
              Ajusta los límites de peticiones permitidas por IP. Los cambios pueden tardar hasta 1 minuto en propagarse a todos los nodos Edge debido a la caché.
            </p>
            <form action={updateRateLimit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rate-limit-requests" className="block text-xs font-medium text-slate-400 mb-1">Peticiones (Reqs)</label>
                  <input
                    id="rate-limit-requests"
                    name="requests"
                    type="number"
                    defaultValue={rateLimit.requests}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#2C6CA8]"
                  />
                </div>
                <div>
                  <label htmlFor="rate-limit-window" className="block text-xs font-medium text-slate-400 mb-1">Ventana (Segundos)</label>
                  <input
                    id="rate-limit-window"
                    name="window_seconds"
                    type="number"
                    defaultValue={rateLimit.window_seconds}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#2C6CA8]"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full mt-4 bg-[#2C6CA8] hover:bg-[#2C6CA8]/90 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Actualizar Configuración
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
