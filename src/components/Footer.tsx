import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-8 bg-panel border-2 border-foreground rounded-2xl mt-12 shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] mb-8">
      <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-foreground bg-brand-red flex items-center justify-center">
              <span className="font-display font-black text-white text-lg leading-none">L</span>
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">VirtualCollector</span>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center text-sm">
          <a className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/politica-privacidad">Privacidad</a>
          <a className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/terminos-condiciones">Términos</a>
          <a className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/politica-cookies">Cookies</a>
          <a className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/politica-propiedad-intelectual">Propiedad Intelectual</a>
          <a className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/aviso-legal">Aviso Legal</a>
      </div>
      
      <div className="text-center md:text-right space-y-1">
          <p className="font-bold text-foreground text-sm">Desarrollado por Víctor Javier Corral</p>
          <p className="text-xs font-medium text-foreground/60">Hecho con cariño desde Málaga 🏖️</p>
      </div>
    </footer>
  );
}
