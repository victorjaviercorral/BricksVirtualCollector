import fs from 'fs';
import path from 'path';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default async function TestingMonitoringPage() {
  let coverageData: any = null;
  let hasError = false;

  try {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const file = fs.readFileSync(coveragePath, 'utf8');
      coverageData = JSON.parse(file);
    }
  } catch (err) {
    hasError = true;
  }

  if (hasError || !coverageData) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Monitorización de Testing</h1>
        <div className="bg-brand-red/10 border-l-4 border-brand-red p-4 rounded-r-lg">
          <p className="text-brand-red font-medium flex items-center gap-2">
            <ShieldAlert size={20} />
            No se ha encontrado el informe de cobertura.
          </p>
          <p className="text-sm mt-2">
            Ejecuta <code>npm run test:coverage</code> para generar el fichero <code>coverage/coverage-summary.json</code>.
          </p>
        </div>
      </div>
    );
  }

  const global = coverageData.total;
  const isPassing = 
    global.lines.pct >= 85 && 
    global.statements.pct >= 85 && 
    global.functions.pct >= 85 && 
    global.branches.pct >= 85;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-display font-bold mb-6">Monitorización de Testing</h1>
      
      <div className={`p-6 rounded-2xl border ${isPassing ? 'bg-brand-green/10 border-brand-green' : 'bg-brand-red/10 border-brand-red'} mb-8 flex items-center justify-between`}>
        <div>
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            {isPassing ? <ShieldCheck className="text-brand-green" /> : <ShieldAlert className="text-brand-red" />}
            Estado Global: {isPassing ? 'Aceptable (>85%)' : 'Crítico (Por debajo del 85%)'}
          </h2>
          <p className="text-sm opacity-80">El umbral mínimo exigido por las reglas del proyecto es 85%.</p>
        </div>
        <div className="text-4xl font-bold">
          {global.lines.pct}%
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-black/20 p-4 rounded-xl shadow-sm border border-black/10 dark:border-white/10">
          <p className="text-sm uppercase tracking-wider opacity-60 font-bold mb-1">Líneas</p>
          <p className={`text-2xl font-bold ${global.lines.pct >= 85 ? 'text-brand-green' : 'text-brand-red'}`}>
            {global.lines.pct}%
          </p>
        </div>
        <div className="bg-white dark:bg-black/20 p-4 rounded-xl shadow-sm border border-black/10 dark:border-white/10">
          <p className="text-sm uppercase tracking-wider opacity-60 font-bold mb-1">Ramas (Branches)</p>
          <p className={`text-2xl font-bold ${global.branches.pct >= 85 ? 'text-brand-green' : 'text-brand-red'}`}>
            {global.branches.pct}%
          </p>
        </div>
        <div className="bg-white dark:bg-black/20 p-4 rounded-xl shadow-sm border border-black/10 dark:border-white/10">
          <p className="text-sm uppercase tracking-wider opacity-60 font-bold mb-1">Funciones</p>
          <p className={`text-2xl font-bold ${global.functions.pct >= 85 ? 'text-brand-green' : 'text-brand-red'}`}>
            {global.functions.pct}%
          </p>
        </div>
        <div className="bg-white dark:bg-black/20 p-4 rounded-xl shadow-sm border border-black/10 dark:border-white/10">
          <p className="text-sm uppercase tracking-wider opacity-60 font-bold mb-1">Sentencias</p>
          <p className={`text-2xl font-bold ${global.statements.pct >= 85 ? 'text-brand-green' : 'text-brand-red'}`}>
            {global.statements.pct}%
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Desglose por Fichero (Fase 1)</h3>
      <div className="bg-white dark:bg-black/20 rounded-xl shadow-sm border border-black/10 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5 text-sm uppercase tracking-wider">
              <th className="p-4 font-bold opacity-70">Fichero</th>
              <th className="p-4 font-bold opacity-70">Líneas</th>
              <th className="p-4 font-bold opacity-70">Ramas</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(coverageData).filter(key => key !== 'total').map(file => {
              const data = coverageData[file];
              const relativePath = file.replace(process.cwd(), '').replace(/\\/g, '/');
              return (
                <tr key={file} className="border-t border-black/5 dark:border-white/5">
                  <td className="p-4 font-mono text-sm">{relativePath}</td>
                  <td className={`p-4 font-bold ${data.lines.pct >= 85 ? 'text-brand-green' : 'text-brand-red'}`}>
                    {data.lines.pct}%
                  </td>
                  <td className={`p-4 font-bold ${data.branches.pct >= 85 ? 'text-brand-green' : 'text-brand-red'}`}>
                    {data.branches.pct}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
