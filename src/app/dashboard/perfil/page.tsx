"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Upload, Trash2, Camera, Palette } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('usuarios_perfil')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setAlias(data.alias || "");
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('usuarios_perfil')
      .update({ alias })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      toast.error("Error al actualizar el perfil");
    } else {
      toast.success("Perfil actualizado correctamente");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica de imagen
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede pesar más de 2MB');
      return;
    }

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    // Path seguro asociado al ID del usuario para evitar sobreescrituras ajenas
    const filePath = `${profile.id}/avatar_${Date.now()}.${fileExt}`;

    // 1. Subir la imagen al bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Error al subir la imagen");
      setSaving(false);
      return;
    }

    // 2. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Actualizar el perfil
    const { error: updateError } = await supabase
      .from('usuarios_perfil')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);

    if (updateError) {
      toast.error("Error al guardar la URL del avatar");
    } else {
      toast.success("Foto de perfil actualizada");
      setProfile({ ...profile, avatar_url: publicUrl });
    }
    
    setSaving(false);
  };

  const handleDeleteAvatar = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('usuarios_perfil')
      .update({ avatar_url: null })
      .eq('id', profile.id);
      
    if (error) {
      toast.error("Error al eliminar la foto");
    } else {
      toast.success("Foto de perfil eliminada");
      setProfile({ ...profile, avatar_url: null });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <User size={28} className="text-brand-blue" />
        <h1 className="font-display font-bold text-3xl">Tu Perfil</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-black/5 dark:bg-white/5 border-4 border-white dark:border-black/50 shadow-xl flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-black/20 dark:text-white/20" />
              )}
            </div>
            
            <label aria-label="Cambiar foto de perfil" className="absolute bottom-0 right-0 w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <Camera size={18} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={saving}
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-bold text-xl mb-1">{profile?.username || "Usuario sin nombre"}</h3>
            <p className="text-sm text-black/60 dark:text-white/60 mb-4">
              Miembro desde {new Date(profile?.creado_en).toLocaleDateString()}
            </p>
            {profile?.avatar_url && (
              <button 
                onClick={handleDeleteAvatar}
                disabled={saving}
                className="text-sm text-brand-red font-bold flex items-center justify-center sm:justify-start gap-2 hover:underline disabled:opacity-50"
              >
                <Trash2 size={16} /> Eliminar foto actual
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label htmlFor="perfil-alias" className="block text-sm font-bold mb-2">Alias (Opcional)</label>
            <p className="text-xs text-black/60 dark:text-white/60 mb-2">
              ¿Cómo quieres que te llame la comunidad en lugar de tu nombre de usuario?
            </p>
            <input
              id="perfil-alias"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: El Maestro Constructor"
              className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
            />
          </div>

          <div className="pt-4 flex justify-end border-b border-black/10 dark:border-white/10 pb-8 mb-8">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8">
          <h2 className="text-xl font-bold text-brand-red mb-2">Zona de Peligro</h2>
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            Al eliminar tu cuenta, se borrarán permanentemente todos tus datos personales, vitrinas y fotos de los servidores. Esta acción no se puede deshacer.
          </p>
          <button
            onClick={async () => {
              if (window.confirm("¿Estás completamente seguro de que deseas eliminar tu cuenta de forma permanente? Se borrará todo tu inventario.")) {
                setSaving(true);
                try {
                  const res = await fetch("/api/auth/delete-account", { method: "POST" });
                  if (!res.ok) throw new Error("Error eliminando cuenta");
                  await supabase.auth.signOut();
                  window.location.href = "/";
                } catch (e) {
                  toast.error("Hubo un error al eliminar tu cuenta. Revisa si está configurado el servicio.");
                  setSaving(false);
                }
              }
            }}
            disabled={saving}
            className="px-4 py-2 bg-brand-red/10 text-brand-red font-bold rounded-xl hover:bg-brand-red hover:text-white transition-colors"
          >
            Eliminar Cuenta Permanentemente
          </button>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 gap-6 mt-8">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 sm:p-8 rounded-3xl flex flex-col gap-6 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <Palette size={24} className="text-black/60 dark:text-white/60" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Preferencias Visuales</h2>
              <p className="text-sm text-black/50">Personaliza cómo ves el museo.</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl">
            <div>
              <p className="font-bold">Modo Oscuro</p>
              <p className="text-sm text-black/50">Cambia la interfaz a colores oscuros.</p>
            </div>
            <div className="w-12 h-6 bg-brand-blue rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-xl">
            <div>
              <p className="font-bold">Notificaciones</p>
              <p className="text-sm text-black/50">Recibe alertas cuando un set sea destacado.</p>
            </div>
            <div className="w-12 h-6 bg-black/20 rounded-full relative cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
            </div>
          </div>
        </motion.section>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 sm:p-8 rounded-3xl border border-brand-red/20 bg-brand-red/5 flex flex-col gap-6"
        >
          <div>
            <h2 className="text-xl font-bold text-brand-red mb-1">Zona Peligrosa</h2>
            <p className="text-sm text-brand-red/70">Acciones destructivas para tu cuenta.</p>
          </div>
          <button className="w-fit px-6 py-3 rounded-xl bg-white dark:bg-black border border-brand-red text-brand-red font-bold flex items-center gap-2 hover:bg-brand-red hover:text-white transition-colors">
            <Trash2 size={18} /> Eliminar Cuenta y Colección
          </button>
        </motion.section>
      </div>
    </div>
  );
}
