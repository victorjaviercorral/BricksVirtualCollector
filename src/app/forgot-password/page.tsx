"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Key } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Te hemos enviado un enlace para recuperar tu contraseña. Revisa tu correo.");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 shadow-sm w-full"
      >
        <Link href="/login" className="inline-flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors mb-6 text-sm font-bold">
          <ArrowLeft size={16} /> Volver al Login
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Key size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Recuperar Contraseña</h1>
            <p className="text-black/60 dark:text-white/60 text-sm">Te enviaremos un enlace mágico</p>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Tu Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
              placeholder="tu@email.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
