import React from 'react';
import { Terminal, AlertTriangle, Filter } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function SystemLogsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
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

  const view = searchParams.view || 'all'; // all, grouped_errors

  let logs = [];
  let groupedErrors = [];

  if (view === 'grouped_errors') {
    // Para simplificar sin crear una vista o RPC en Supabase, traemos los errores y los agrupamos en memoria 
    // (En producción masiva, esto debería ser un RPC en BD para mayor rendimiento)
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .eq('level', 'error')
      .order('created_at', { ascending: false })
      .limit(500);

    const map = new Map();
    (data || []).forEach(log => {
      const key = log.message;
      if (!map.has(key)) {
        map.set(key, { ...log, count: 1, last_seen: log.created_at });
      } else {
        map.get(key).count += 1;
      }
    });
    groupedErrors = Array.from(map.values());
  } else {
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    logs = data || [];
  }

  return (
    <div className="space-y-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System Logs</h2>
          <p className="text-sm text-slate-400 mt-1">Explorador de eventos y agrupación de incidencias.</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1 border border-slate-800 rounded-xl">
          <a href="/admin/system/logs?view=all" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'all' ? 'bg-[#2C6CA8] text-white' : 'text-slate-400 hover:text-white'}`}>
            Todos los Logs
          </a>
          <a href="/admin/system/logs?view=grouped_errors" className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${view === 'grouped_errors' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}>
            <AlertTriangle className="w-4 h-4" /> Errores Agrupados
          </a>
        </div>
      </header>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500" />
            {view === 'all' ? 'Últimos 100 eventos' : 'Errores únicos (Agrupados por mensaje)'}
          </h3>
          <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Nivel</th>
                <th className="px-6 py-4 font-medium">Mensaje / Evento</th>
                <th className="px-6 py-4 font-medium">{view === 'grouped_errors' ? 'Frecuencia' : 'Origen'}</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {(view === 'all' ? logs : groupedErrors).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron registros.
                  </td>
                </tr>
              ) : null}

              {(view === 'all' ? logs : groupedErrors).map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${log.level === 'error' || log.level === 'fatal' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        log.level === 'warning' ? 'bg-[#E8A927]/10 text-[#E8A927] border-[#E8A927]/20' : 
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium ${log.level === 'error' || log.level === 'fatal' ? 'text-rose-200' : 'text-slate-300'}`}>
                    <div className="max-w-xl break-words">
                      {log.message}
                      {log.stack_trace && (
                        <div className="hidden group-hover:block mt-2 text-xs font-mono text-slate-500 bg-slate-950/50 p-2 rounded whitespace-pre-wrap">
                          {log.stack_trace.split('\n').slice(0, 3).join('\n')}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {view === 'grouped_errors' ? (
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-800 text-slate-300 rounded-full font-mono text-xs border border-slate-700">
                        {log.count} repeticiones
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-slate-400 font-mono bg-slate-800/50 px-2 py-0.5 rounded w-fit">{log.endpoint || 'Internal'}</span>
                        {log.user_id && <span className="text-slate-500 truncate w-32" title={log.user_id}>User: {log.user_id.substring(0, 8)}...</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(log.created_at || log.last_seen).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
