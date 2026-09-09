"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { GUEST_TERMS_VERSION } from "@/lib/legal";

/**
 * Entrada al modo invitado (ADR-011). Toda la lógica vive aquí: la usan `/login`, `/registro` y
 * la home. Un clic crea una sesión anónima de Supabase (`is_anonymous`), que la migración
 * `20260909110000_acceso_invitado.sql` marca como `es_invitado` y aísla en su propio sandbox.
 *
 * La aceptación de los Términos es TÁCITA (por acción) — decisión del titular, 2026-09-09, ver
 * ADR-011 §"Consentimiento y aceptación": un invitado no aporta datos personales, así que no hay
 * consentimiento RGPD que recabar; sí acepta el contrato de uso al entrar. Se deja rastro en
 * `raw_user_meta_data.guest_terms_version`.
 */
export function EntrarComoInvitado({ variant = "panel" }: { variant?: "panel" | "hero" }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const entrar = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { guest_terms_version: GUEST_TERMS_VERSION } },
    });
    if (error) {
      setLoading(false);
      toast.error("No se pudo iniciar la demo. Vuelve a intentarlo en unos segundos.");
      return;
    }
    // Recarga completa para que el layout de servidor lea la nueva sesión (mismo patrón que login).
    window.location.href = "/dashboard";
  };

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={entrar}
        disabled={loading}
        className="group inline-flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground transition-colors disabled:opacity-50"
      >
        <FlaskConical size={16} />
        {loading ? "Entrando a la demo…" : "O prueba la demo sin registrarte"}
        {!loading && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
      </button>
    );
  }

  return (
    <div className="pt-6 border-t border-black/10 dark:border-white/10 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <FlaskConical className="text-brand-green shrink-0 mt-0.5" size={20} />
        <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
          <strong className="text-brand-green">Zona de pruebas para early adopters.</strong> Prueba
          toda la plataforma sin registrarte, en un entorno aislado con la misma funcionalidad que
          la versión real. No pedimos email. Lo que crees aquí se borra a las 48&nbsp;h y no es
          público. Al continuar aceptas los{" "}
          <Link href="/legal/terminos-condiciones" className="font-bold text-brand-blue hover:underline" target="_blank">
            Términos y Condiciones
          </Link>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={entrar}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border-2 border-foreground/20 py-3 rounded-xl font-bold hover:border-foreground/40 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
      >
        {loading ? "Entrando a la demo…" : "Probar sin registrarme"}
        {!loading && <ArrowRight size={18} />}
      </button>
    </div>
  );
}
