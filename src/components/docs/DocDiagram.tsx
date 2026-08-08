import { 
  Smartphone, Image as ImageIcon, ShieldAlert, Cloud, Lock, Globe, Link as LinkIcon, 
  FolderTree, Package, ToyBrick, ArrowRight, Eye, EyeOff, MapPinOff
} from 'lucide-react';

interface DocDiagramProps {
  type: string;
}

export default function DocDiagram({ type }: DocDiagramProps) {
  if (type === 'anonimato-flow') {
    return (
      <div className="not-prose my-8 p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 font-sans">
        <h4 className="text-sm font-bold text-black/60 dark:text-white/60 uppercase tracking-wider mb-6 text-center">
          Proceso de Protección EXIF
        </h4>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {/* Step 1: User Device */}
          <div className="flex flex-col items-center text-center w-32">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black border-2 border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm mb-3 text-black dark:text-white">
              <Smartphone size={32} />
            </div>
            <span className="text-sm font-bold">Tu dispositivo</span>
            <span className="text-xs text-black/60 dark:text-white/60">Foto con ubicación real</span>
          </div>

          <ArrowRight className="text-brand-blue hidden md:block" size={24} />
          <div className="h-6 w-px bg-brand-blue md:hidden" />

          {/* Step 2: Browser (Local Strip) */}
          <div className="flex flex-col items-center text-center w-36 relative">
            <div className="w-16 h-16 rounded-2xl bg-brand-blue border-2 border-brand-blue flex items-center justify-center shadow-sm mb-3 text-white">
              <MapPinOff size={32} />
            </div>
            <span className="text-sm font-bold">Navegador Local</span>
            <span className="text-xs text-brand-blue">Elimina metadatos EXIF / GPS</span>
            {/* Tooltip/Badge */}
            <div className="absolute -top-3 -right-2 bg-brand-yellow text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              Proceso Local
            </div>
          </div>

          <ArrowRight className="text-brand-blue hidden md:block" size={24} />
          <div className="h-6 w-px bg-brand-blue md:hidden" />

          {/* Step 3: Cloud (Safe) */}
          <div className="flex flex-col items-center text-center w-32">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-black border-2 border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm mb-3 text-black dark:text-white">
              <Cloud size={32} />
            </div>
            <span className="text-sm font-bold">Servidor Seguro</span>
            <span className="text-xs text-black/60 dark:text-white/60">Imagen anónima recibida</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'vitrina-structure') {
    return (
      <div className="not-prose my-8 p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 font-sans">
        <div className="flex flex-col items-center">
          {/* Nivel 1: Vitrina */}
          <div className="flex items-center gap-3 bg-white dark:bg-black px-6 py-3 rounded-xl border-2 border-black/10 dark:border-white/10 shadow-sm z-10">
            <FolderTree className="text-brand-blue" />
            <div>
              <span className="block font-bold leading-tight">Vitrina Temática</span>
              <span className="text-xs text-black/60 dark:text-white/60 leading-tight">Ej. "Naves de Star Wars"</span>
            </div>
          </div>
          
          <div className="w-px h-6 bg-black/20 dark:bg-white/20" />
          <div className="w-64 h-px bg-black/20 dark:bg-white/20" />
          
          {/* Nivel 2: Sets */}
          <div className="flex justify-between w-full max-w-sm mt-0 relative">
            <div className="w-px h-6 bg-black/20 dark:bg-white/20 absolute left-0" />
            <div className="w-px h-6 bg-black/20 dark:bg-white/20 absolute right-0" />
            <div className="w-px h-6 bg-black/20 dark:bg-white/20 absolute left-1/2 -translate-x-1/2" />
          </div>

          <div className="flex justify-between w-full max-w-sm gap-4 mt-6">
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white dark:bg-black rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center mb-2 shadow-sm">
                <Package className="text-brand-red" size={20} />
              </div>
              <span className="text-xs font-bold">Set 1</span>
              <span className="text-[10px] text-black/60 dark:text-white/60">Halcón Milenario</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white dark:bg-black rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center mb-2 shadow-sm">
                <Package className="text-brand-yellow" size={20} />
              </div>
              <span className="text-xs font-bold">Set 2</span>
              <span className="text-[10px] text-black/60 dark:text-white/60">X-Wing</span>
            </div>

            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white dark:bg-black rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center mb-2 shadow-sm">
                <Package className="text-brand-blue" size={20} />
              </div>
              <span className="text-xs font-bold">Set 3</span>
              <span className="text-[10px] text-black/60 dark:text-white/60">TIE Fighter</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'visibilidad-levels') {
    return (
      <div className="not-prose my-8 grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
        {/* Pública */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border-2 border-brand-blue/30 hover:border-brand-blue transition-colors shadow-sm flex flex-col">
          <div className="w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue mb-4">
            <Globe size={20} />
          </div>
          <h4 className="font-bold mb-1">Pública</h4>
          <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
            Visible en la sección Explorar. Cualquier persona en el mundo puede admirar tu colección de forma anónima.
          </p>
        </div>

        {/* Privada */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border-2 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-colors shadow-sm flex flex-col">
          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-black/60 dark:text-white/60 mb-4">
            <Lock size={20} />
          </div>
          <h4 className="font-bold mb-1">Privada</h4>
          <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
            Nadie más puede verla. Solo tú tienes acceso cuando inicias sesión en tu panel.
          </p>
        </div>

        {/* Oculta con enlace */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border-2 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-colors shadow-sm flex flex-col opacity-70 grayscale">
          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center text-black/60 dark:text-white/60 mb-4">
            <LinkIcon size={20} />
          </div>
          <h4 className="font-bold mb-1 flex items-center gap-2">
            Con Enlace 
            <span className="text-[9px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded-sm uppercase">Próximamente</span>
          </h4>
          <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed">
            Oculta de la zona Explorar, pero accesible para quienes tengan el enlace directo secreto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-brand-red/10 text-brand-red rounded-lg text-sm font-mono border border-brand-red/20">
      Diagram type "{type}" not found.
    </div>
  );
}
