'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { systemLogger } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registramos el error de forma asíncrona en Supabase
    systemLogger.fatal('Uncaught Global Error', {
      stackTrace: error.stack,
      context: { digest: error.digest, message: error.message }
    });
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-200 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-rose-500/20 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">¡Ups! Algo ha salido muy mal.</h2>
          <p className="text-slate-400 text-sm mb-6">
            Ha ocurrido un error crítico. Nuestro equipo de soporte técnico acaba de ser notificado automáticamente con los detalles.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Intentar recuperar la página
          </button>
        </div>
      </body>
    </html>
  );
}
