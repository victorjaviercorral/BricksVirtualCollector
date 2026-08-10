import React from 'react';
import { BookOpen, Shield, LifeBuoy, AlertCircle, FileText } from 'lucide-react';

export default function SystemDocsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      
      <header>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[#2C6CA8]" />
          Runbook y Manual Operativo
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          Guía de actuación y documentación del Sistema In-House de Observabilidad.
        </p>
      </header>

      <div className="grid gap-6">
        
        {/* SECCIÓN 1 */}
        <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#3F8552]" />
            Control de Tráfico (Rate Limiting)
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p>
              El Rate Limiter protege la aplicación desde los servidores "Edge" (middleware) antes de que las peticiones lleguen a la Base de Datos.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong>Comportamiento Normal:</strong> Está configurado por defecto en 100 peticiones por minuto por IP.</li>
              <li><strong>Durante un Ataque (DDoS / Scraping masivo):</strong> Ve a la pestaña <em>Health</em> y reduce el límite global a algo restrictivo (Ej: 20 req / 60s).</li>
              <li><strong>Caché:</strong> Los cambios que hagas en el panel tardan hasta <strong>1 minuto</strong> en propagarse debido a la caché de lectura de Supabase en el Edge. No pulses el botón múltiples veces.</li>
            </ul>
          </div>
        </section>

        {/* SECCIÓN 2 */}
        <section className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-[#E8A927]" />
            Gestión de Logs y Agrupación
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <p>
              La pestaña <em>System Logs</em> reemplaza a herramientas externas como Sentry. Captura excepciones de ruta, errores de cliente (pantallazos rojos) y llamadas directas al `systemLogger`.
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong>Vista Normal:</strong> Muestra los últimos 100 eventos cronológicamente.</li>
              <li><strong>Errores Agrupados:</strong> Utiliza esta vista cuando veas muchos errores seguidos. Agrupa los fallos con el mismo mensaje para entender rápidamente qué está roto sin inundar la pantalla.</li>
              <li><strong>Retención:</strong> Los logs de más de 30 días se purgan automáticamente cada noche mediante un job de <code>pg_cron</code> (ver <code>supabase/migrations/20260810130000_system_logs_purge.sql</code>). No requiere intervención manual; puedes verificar su ejecución en <code>cron.job_run_details</code> desde el SQL Editor de Supabase.</li>
            </ul>
          </div>
        </section>

        {/* SECCIÓN 3: PROTOCOLO DE REPORTE A ANTIGRAVITY */}
        <section className="bg-slate-900/80 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <LifeBuoy className="w-32 h-32 text-rose-500" />
          </div>
          
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 relative z-10">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Protocolo de Escalado y Reporte (Antigravity)
          </h3>
          <div className="space-y-4 text-sm text-slate-300 relative z-10">
            <p className="font-medium text-rose-200">
              ¿Hay un error crítico que no sabes cómo resolver? Sigue estos pasos exactos antes de contactar a tu agente de IA (Antigravity):
            </p>
            
            <div className="bg-slate-950/50 rounded-xl p-4 border border-rose-500/10">
              <ol className="list-decimal list-inside space-y-3">
                <li>Ve a la pestaña <strong>System Logs</strong> y selecciona la vista <em>Errores Agrupados</em>.</li>
                <li>Copia el <strong>Mensaje de Error exacto</strong> y, si lo hay, las primeras 3 líneas del <strong>Stack Trace</strong> (aparece al pasar el ratón).</li>
                <li>Ve a la pestaña <strong>Health</strong> y anota el <strong>Commit Activo (PROD)</strong>.</li>
                <li>
                  Inicia un prompt con Antigravity escribiendo el siguiente formato:
                  <div className="mt-2 p-3 bg-[#0B1120] rounded border border-slate-700 font-mono text-xs text-slate-400">
                    "INCIDENCIA CRÍTICA EN PRODUCCIÓN.<br/>
                    Commit desplegado: [Pegar Hash Vercel]<br/>
                    Error registrado: [Pegar Mensaje de error]<br/>
                    Endpoint/Contexto: [Pegar Ruta afectada]<br/>
                    <br/>
                    Analiza la base de código en este endpoint y elabora un plan de mitigación inmediato."
                  </div>
                </li>
              </ol>
            </div>
            
            <p className="text-xs text-slate-500 mt-4">
              Este protocolo asegura que Antigravity tenga el contexto exacto del fallo y la versión del código que se está ejecutando para darte la solución más precisa.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
