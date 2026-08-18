"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Map, Target, ShieldAlert, LogOut } from "lucide-react";
import { isModeratorRole } from "@/lib/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAdmin();
  }, []);

  const [userRole, setUserRole] = useState<string>('');

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("usuarios_perfil")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || '';
    setUserRole(role);
    if (role.includes('admin') || role.includes('admin_exposiciones') || role.includes('sysadmin')) {
      setIsAdmin(true);
    } else {
      router.push("/dashboard");
    }
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center font-bold">Verificando credenciales...</div>;
  }

  if (!isAdmin) return null;

  const links = [
    { href: "/admin/exposiciones", label: "Exposiciones", icon: <Map size={20} />, show: true },
    { href: "/admin/bounties", label: "Bounties", icon: <Target size={20} />, show: true },
    // Hallazgo N7 (Iteración 3), cerrado 18/08/2026 (decisión D2): antes se mostraba también a
    // "sysadmin", que la propia página y las Server Actions de moderación siempre rechazaron --
    // un sysadmin veía el enlace y era expulsado al pulsarlo. Única fuente de verdad en
    // src/lib/roles.ts, compartida con page.tsx y actions.ts.
    { href: "/admin/moderacion", label: "Moderación", icon: <ShieldAlert size={20} />, show: isModeratorRole(userRole) },
    { href: "/admin/system/health", label: "System", icon: <ShieldAlert size={20} />, show: userRole.includes('sysadmin') },
  ].filter(link => link.show);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-panel border-r-2 border-b-2 md:border-b-0 border-foreground p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-red rounded-lg border-2 border-foreground flex items-center justify-center font-black text-white">A</div>
            <span className="font-display font-black text-xl">Admin Panel</span>
          </div>

          <nav className="flex flex-col gap-2">
            {links.map(link => {
              const active = link.label === 'System' 
                ? pathname.startsWith('/admin/system')
                : pathname.startsWith(link.href);
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-foreground font-bold transition-all hover:translate-x-1 ${active ? 'bg-brand-yellow shadow-[2px_2px_0px_0px_#0F172A] dark:shadow-[2px_2px_0px_0px_#F8F9FA]' : 'bg-transparent shadow-none hover:bg-black/5'}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground transition-colors">
            <LogOut size={16} /> Volver al Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
