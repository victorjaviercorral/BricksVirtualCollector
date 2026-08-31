"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { TourLauncher } from "@/components/tour/TourLauncher";

export function Navbar({ user, profile }: { user: any, profile?: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/5 dark:border-white/5 glass bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm group-active:scale-95 transition-transform">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm sm:text-base leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-red via-brand-blue to-brand-yellow">
              BricksVirtualCollector
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-black/50 dark:text-white/50 leading-tight uppercase tracking-widest">
              Para coleccionistas de LEGO&reg;
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden sm:flex flex-1 items-center justify-end gap-6 text-sm font-medium">
          <Link 
            href={user ? "/dashboard" : "/"} 
            className={`transition-colors ${(user && pathname === '/dashboard') || (!user && pathname === '/') ? 'text-brand-blue font-bold' : 'hover:text-brand-blue'}`}
          >
            {user ? "Inicio" : "Explorar"}
          </Link>
          {user && (
            <>
              <Link 
                href="/dashboard/vitrinas" 
                className={`transition-colors ${pathname === '/dashboard/vitrinas' ? 'text-brand-blue font-bold' : 'hover:text-brand-blue'}`}
              >
                Mis Vitrinas
              </Link>
              <Link 
                href="/dashboard/insignias" 
                className={`transition-colors ${pathname === '/dashboard/insignias' ? 'text-brand-red font-bold' : 'hover:text-brand-red'}`}
              >
                Mis Insignias
              </Link>
              <Link 
                href="/dashboard/participaciones" 
                className={`transition-colors ${pathname === '/dashboard/participaciones' ? 'text-brand-yellow font-bold' : 'hover:text-brand-yellow'}`}
              >
                Participaciones
              </Link>
            </>
          )}

          <Link 
            href="/como-funciona" 
            className={`transition-colors ${pathname.startsWith('/como-funciona') ? 'text-brand-blue font-bold' : 'hover:text-brand-blue'}`}
          >
            Cómo funciona
          </Link>
          
          <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-2" />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                aria-label="Menú de perfil"
                aria-expanded={isProfileDropdownOpen}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/10 dark:hover:border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden border border-foreground/10">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.email ? user.email.charAt(0).toUpperCase() : <User size={16} />
                  )}
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-panel border-2 border-foreground rounded-xl shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] overflow-hidden py-1 flex flex-col z-50">
                  <div className="px-4 py-2 border-b border-foreground/10">
                    <p className="text-xs font-medium text-foreground/60 truncate">Conectado como</p>
                    <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard/perfil"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings size={16} />
                    Mi Perfil
                  </Link>
                  <TourLauncher variant="menu-item" onLaunch={() => setIsProfileDropdownOpen(false)} />
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-red hover:bg-brand-red/10 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-foreground text-background px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Entrar
            </Link>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile menu toggle & ThemeToggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 w-full bg-background border-b border-black/5 dark:border-white/5 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 gap-4 text-base font-medium">
            <Link
              href={user ? "/dashboard" : "/"}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-lg ${(user && pathname === '/dashboard') || (!user && pathname === '/') ? 'bg-black/5 dark:bg-white/5 text-brand-blue font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              {user ? "Inicio" : "Explorar"}
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard/vitrinas"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-lg ${pathname === '/dashboard/vitrinas' ? 'bg-black/5 dark:bg-white/5 text-brand-blue font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  Mis Vitrinas
                </Link>
                <Link
                  href="/dashboard/insignias"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-lg ${pathname === '/dashboard/insignias' ? 'bg-black/5 dark:bg-white/5 text-brand-red font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  Mis Insignias
                </Link>
                <Link
                  href="/dashboard/participaciones"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-lg ${pathname === '/dashboard/participaciones' ? 'bg-black/5 dark:bg-white/5 text-brand-yellow font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  Participaciones
                </Link>
              </>
            )}

            <Link
              href="/como-funciona"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-lg ${pathname.startsWith('/como-funciona') ? 'bg-black/5 dark:bg-white/5 text-brand-blue font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              Cómo funciona
            </Link>

            <div className="h-px w-full bg-black/10 dark:bg-white/10 my-2" />

            {user ? (
              <>
                <div className="px-2 py-1 mb-2">
                  <p className="text-xs text-foreground/60">Conectado como</p>
                  <p className="text-sm font-bold truncate">{user.email}</p>
                </div>
                <Link
                  href="/dashboard/perfil"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                >
                  <Settings size={18} />
                  Mi Perfil
                </Link>
                <TourLauncher variant="menu-item" onLaunch={() => setIsMobileMenuOpen(false)} />
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-2 flex items-center gap-3 text-brand-red hover:bg-brand-red/10 rounded-lg text-left"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-foreground text-background px-4 py-3 rounded-lg font-bold text-center mt-2"
              >
                Entrar / Empezar a Coleccionar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
