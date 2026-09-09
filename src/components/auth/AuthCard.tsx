"use client";

import * as motion from "framer-motion/client";
import type { ReactNode } from "react";

/**
 * Shell visual compartido por `/login` y `/registro` (regla Zero-Duplication de AGENTS.md).
 * Extraído del markup de `login/page.tsx` para que las dos pantallas de acceso no diverjan.
 */
export function AuthCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full glass p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col gap-6"
      >
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-brand-blue rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-md">
            {icon}
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">{title}</h1>
          <p className="text-black/60 dark:text-white/60 text-sm">{subtitle}</p>
        </div>

        {children}
      </motion.div>
    </div>
  );
}
