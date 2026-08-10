import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-8 px-8 flex flex-col gap-8 bg-panel border-2 border-foreground rounded-2xl mt-12 shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] mb-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-foreground bg-brand-red flex items-center justify-center">
                <span className="font-display font-black text-white text-lg leading-none">B</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">BricksVirtualCollector</span>
        </div>

        <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/politica-privacidad">Privacidad</Link>
            <Link className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/terminos-condiciones">Términos</Link>
            <Link className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/politica-cookies">Cookies</Link>
            <Link className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/politica-propiedad-intelectual">Propiedad Intelectual</Link>
            <Link className="font-bold text-foreground/80 hover:text-brand-blue transition-colors" href="/legal/aviso-legal">Aviso Legal</Link>
        </div>

        <div className="text-center md:text-right space-y-1">
            <p className="font-bold text-foreground text-sm">Desarrollado por Víctor Javier Corral</p>
            <p className="text-xs font-medium text-foreground/60">Hecho con cariño desde Málaga 🏖️</p>
        </div>
      </div>

      {/*
        Disclaimer de marca y aviso de prototipo.
        Requerido de forma visible por legal/auditoria_legal.md §1 (hallazgo D3 de la auditoría)
        y por legal/analisis-titularidad-persona-fisica.md §3 y §6.
      */}
      <div className="border-t-2 border-foreground/10 pt-6 space-y-2 text-center">
        <p className="text-xs font-medium text-foreground/70 max-w-3xl mx-auto">
          <strong className="text-foreground">Proyecto independiente sin ánimo de lucro.</strong>{" "}
          No está afiliado, patrocinado ni avalado por The LEGO Group. LEGO&reg; es una marca
          registrada de The LEGO Group, que no patrocina, autoriza ni avala este sitio.
        </p>
        <p className="text-xs font-medium text-foreground/60 max-w-3xl mx-auto">
          <strong className="text-foreground/80">Prototipo de demostración.</strong>{" "}
          No es un producto comercial: no ofrece servicios de pago, no muestra publicidad y no
          admite el registro de nuevos usuarios. El contenido mostrado es ficticio.
        </p>
        <p className="text-[11px] font-medium text-foreground/40 pt-2">
          &copy; {currentYear} Víctor Javier Corral
        </p>
      </div>
    </footer>
  );
}
