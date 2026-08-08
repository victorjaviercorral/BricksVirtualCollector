'use client';

import { useEffect } from 'react';
import { systemLogger } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registramos el error de ruta en Supabase
    systemLogger.error('Unhandled Route Error', {
      stackTrace: error.stack,
      context: { digest: error.digest, message: error.message }
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <div className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl border border-rose-500/20 p-8 rounded-2xl max-w-md w-full shadow-sm">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Algo ha fallado en esta sección.</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Nuestros sistemas han registrado este incidente y lo revisaremos pronto.
        </p>
        <button
          onClick={() => reset()}
          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium py-2 px-6 rounded-xl transition-colors text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
