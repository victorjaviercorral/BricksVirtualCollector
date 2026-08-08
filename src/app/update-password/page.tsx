"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Key, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada con éxito.");
      router.push("/dashboard");
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
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
            <Lock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Nueva Contraseña</h1>
            <p className="text-black/60 dark:text-white/60 text-sm">Establece tu nueva contraseña segura</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Nueva Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-brand-green/50 outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
