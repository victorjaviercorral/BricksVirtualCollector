"use client";

import { useState, useEffect } from "react";
import { X, Mail, Key, ShieldCheck } from "lucide-react";
import * as motion from "framer-motion/client";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TERMS_VERSION } from "@/lib/legal";

/**
 * Fase 4 (ADR-011): convierte una sesión de invitado en una cuenta real conservando todo lo
 * creado (mismo `auth.uid()`). Añade email + contraseña con `updateUser`; el trigger
 * `on_auth_user_upgraded` (migración 20260909130000) sincroniza `usuarios_perfil` cuando
 * Supabase marca `is_anonymous = false`.
 */
export function UpgradeCuentaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error("Debes aceptar la Política de Privacidad y los Términos para crear la cuenta.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: { terms_version: TERMS_VERSION },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user && !data.user.is_anonymous) {
      // Supabase no exige confirmación de email: la cuenta ya es real.
      toast.success("¡Cuenta guardada! Tu colección es ahora permanente.");
      window.location.href = "/dashboard";
      return;
    }

    // Confirmación de email pendiente.
    setSent(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
        className="bg-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-black/10 dark:border-white/10 relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
          <h2 id="upgrade-modal-title" className="text-xl font-display font-bold">Guarda tu colección</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/50 dark:text-white/50" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="p-6 flex flex-col gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green mx-auto flex items-center justify-center">
              <Mail size={26} />
            </div>
            <p className="text-sm text-black/70 dark:text-white/70">
              Te hemos enviado un enlace a <strong>{email}</strong>. Confírmalo para terminar de crear
              tu cuenta. Tu colección se conserva tal cual — el mismo perfil, ahora permanente.
            </p>
            <button onClick={onClose} className="mt-2 w-full bg-foreground text-background py-3 rounded-xl font-bold hover:opacity-90 transition-all">
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpgrade} className="p-6 flex flex-col gap-4">
            <p className="text-sm text-black/60 dark:text-white/60">
              Añade un correo y una contraseña. Todo lo que has creado en la demo se conserva y pasa
              a ser permanente y publicable.
            </p>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coleccionista@ejemplo.com"
                required
                aria-label="Correo electrónico"
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>

            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                aria-label="Contraseña"
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="upgrade-terms"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 shrink-0 accent-brand-blue"
              />
              <label htmlFor="upgrade-terms" className="text-xs text-black/70 dark:text-white/70">
                Al crear la cuenta empieza el tratamiento de tus datos personales (tu correo). He leído
                y acepto la{" "}
                <Link href="/legal/politica-privacidad" className="font-bold text-brand-blue hover:underline" target="_blank">Política de Privacidad</Link> y los{" "}
                <Link href="/legal/terminos-condiciones" className="font-bold text-brand-blue hover:underline" target="_blank">Términos</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-brand-blue/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              {loading ? "Guardando..." : "Guardar mi colección"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
