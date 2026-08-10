"use client";
import { useState } from "react";
import { Lock, Mail, ShieldCheck, ArrowRight, Key } from "lucide-react";
import * as motion from "framer-motion/client";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setIsError(true);
      setMessage("Debes aceptar la Política de Privacidad y los Términos para continuar.");
      return;
    }
    
    setLoading(true);
    setMessage('');
    setIsError(false);
    
    // Intentar hacer login primero
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Si da error de credenciales, intentar registrar al usuario
    if (error && error.message.includes('Invalid login credentials')) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            terms_version: 'v1.0'
          }
        }
      });
      
      if (!signUpError) {
        if (data.session) {
          // Redirigir al dashboard si el registro (y autologin) es exitoso
          window.location.href = '/dashboard';
        } else {
          setIsError(true);
          setMessage('Cuenta creada, pero Supabase exige confirmación por email. ¡Aún tienes activado el "Confirm email" en Supabase!');
        }
        setLoading(false);
        return;
      }
      error = signUpError;
    }

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full glass p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col gap-6"
      >
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-brand-blue rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-md">
            <Lock size={28} />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Acceso Seguro</h1>
          <p className="text-black/60 dark:text-white/60 text-sm">
            Entra a tu comunidad de coleccionistas. Si no tienes cuenta, te la crearemos al instante.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
              <input
                id="login-email"
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
            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wider text-black/50 ml-1">Contraseña</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>
            
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-bold text-brand-blue hover:underline">
                ¿Has olvidado tu contraseña?
              </Link>
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
            {loading ? 'Entrando...' : 'Entrar / Registrarse'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          {message && (
            <p className={`text-sm text-center font-medium mt-2 ${isError ? 'text-brand-red' : 'text-brand-blue'}`}>
              {message}
            </p>
          )}
        </form>

        <div className="mt-4 pt-6 border-t border-black/10 dark:border-white/10 flex items-start gap-3 bg-brand-green/5 p-4 rounded-2xl">
          <ShieldCheck className="text-brand-green shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-black/60 dark:text-white/60">
            <strong className="text-brand-green">100% Anónimo.</strong> Nunca mostraremos tu correo. Se te asignará un alias aleatorio (ej. <em>MasterBuilder_84</em>) que podrás cambiar en tus ajustes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}