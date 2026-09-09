"use client";
import { useState } from "react";
import { UserPlus, Mail, ArrowRight, Key } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { EntrarComoInvitado } from "@/components/EntrarComoInvitado";
import { TERMS_VERSION } from "@/lib/legal";

export default function Registro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const supabase = createClient();

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setIsError(true);
      setMessage("Debes aceptar la Política de Privacidad y los Términos para crear una cuenta.");
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { terms_version: TERMS_VERSION } },
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = '/dashboard';
      return;
    }

    // Sin sesión inmediata: Supabase tiene activada la confirmación por email.
    setIsError(false);
    setMessage('Cuenta creada. Revisa tu correo para confirmar la dirección y poder entrar.');
    setLoading(false);
  };

  return (
    <AuthCard
      icon={<UserPlus size={28} />}
      title="Crea tu cuenta"
      subtitle="Tu contenido entra en la galería y los perfiles públicos, y se conserva sin límite de tiempo."
    >
      <form className="flex flex-col gap-4" onSubmit={handleRegistro}>
        <div className="flex flex-col gap-2">
          <label htmlFor="registro-email" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Correo Electrónico</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
            <input
              id="registro-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coleccionista@ejemplo.com"
              required
              className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="registro-password" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Contraseña</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
            <input
              id="registro-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 mt-2">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 shrink-0 accent-brand-blue"
          />
          <label htmlFor="terms" className="text-sm text-black/70 dark:text-white/70">
            He leído y acepto la <Link href="/legal/politica-privacidad" className="font-bold text-brand-blue hover:underline" target="_blank">Política de Privacidad</Link> y los <Link href="/legal/terminos-condiciones" className="font-bold text-brand-blue hover:underline" target="_blank">Términos y Condiciones</Link>.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-md group disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        </button>

        {message && (
          <p className={`text-sm text-center font-medium mt-2 ${isError ? 'text-brand-red' : 'text-brand-blue'}`}>
            {message}
          </p>
        )}
      </form>

      <p className="text-sm text-center text-black/60 dark:text-white/60">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-bold text-brand-blue hover:underline">
          Entra
        </Link>
      </p>

      <EntrarComoInvitado variant="panel" />
    </AuthCard>
  );
}
