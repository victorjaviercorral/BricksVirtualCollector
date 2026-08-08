import Link from "next/link";
import { ShieldCheck, EyeOff, CameraOff, MapPinOff, ArrowLeft } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-10">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-blue font-bold mb-6 hover:underline">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 tracking-tight">
          Cómo funciona y Privacidad
        </h1>
        <p className="text-xl text-black/60 dark:text-white/60">
          En Lego Virtual Collector Community nos tomamos muy en serio tu privacidad. Construye, comparte y gana recompensas en tu museo digital con total tranquilidad.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <section className="glass rounded-[2rem] p-8 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
              <CameraOff size={24} />
            </div>
            <h2 className="text-2xl font-bold">Borrado de Metadatos (EXIF)</h2>
          </div>
          <div className="pl-16">
            <p className="text-black/70 dark:text-white/70 mb-4 leading-relaxed">
              Las fotos tomadas con teléfonos móviles suelen incluir <strong>datos EXIF ocultos</strong>, que contienen información sensible como las coordenadas exactas (<MapPinOff className="inline w-4 h-4 text-brand-red" />) de dónde se tomó la foto.
            </p>
            <p className="text-black/70 dark:text-white/70 leading-relaxed font-medium">
              Al subir una foto a tu vitrina, nuestro sistema procesa la imagen <strong>en tu propio dispositivo (navegador)</strong>, extrae únicamente los píxeles visuales y descarta absolutamente todos los metadatos antes de enviarla a nuestros servidores. Tus coordenadas y datos de cámara nunca salen de tu ordenador.
            </p>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-8 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <EyeOff size={24} />
            </div>
            <h2 className="text-2xl font-bold">Control de Privacidad</h2>
          </div>
          <div className="pl-16">
            <p className="text-black/70 dark:text-white/70 mb-4 leading-relaxed">
              Sabemos que algunas colecciones son privadas. Por eso, al crear una Vitrina puedes elegir entre dos niveles de privacidad:
            </p>
            <ul className="space-y-4 text-black/70 dark:text-white/70">
              <li className="flex gap-3 bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                <ShieldCheck className="text-brand-blue shrink-0" />
                <div>
                  <strong className="text-black dark:text-white block">Privada</strong>
                  Solo tú podrás acceder a esta vitrina estando logueado. Es perfecta para llevar un inventario personal o gestionar colecciones de gran valor que no deseas exponer al público.
                </div>
              </li>
              <li className="flex gap-3 bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                <ShieldCheck className="text-brand-blue shrink-0" />
                <div>
                  <strong className="text-black dark:text-white block">Pública</strong>
                  La vitrina aparecerá en "Explorar el Museo" y otros coleccionistas podrán entrar, ver tus sets y darte Bricks (Likes). Aún así, tu identidad real siempre permanece oculta tras tu alias.
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-8 border border-black/5 dark:border-white/5">
          <h2 className="text-2xl font-bold mb-4">¿Cómo funciona el Museo?</h2>
          <div className="space-y-4 text-black/70 dark:text-white/70 leading-relaxed">
            <p><strong>1. Perfil y Avatar:</strong> Puedes personalizar tu identidad subiendo una foto de perfil y definiendo un "Alias". Este Alias será tu nombre público en la comunidad, manteniendo oculta tu información de inicio de sesión.</p>
            <p><strong>2. Vitrinas (Carpetas):</strong> Primero debes crear al menos una vitrina (temática o general). Esta funciona como una carpeta o álbum. Puedes elegir si es pública o privada.</p>
            <p><strong>3. Compartir Vitrinas:</strong> Cada vitrina pública tiene un enlace especial de "solo lectura" que puedes compartir por WhatsApp o redes sociales. Estas páginas son seguras y muestran tu colección al mundo sin riesgo de que la modifiquen.</p>
            <p><strong>4. Sets y EXIF:</strong> Dentro de cada vitrina puedes añadir tus Sets. Te pediremos información oficial e información sobre su estado de conservación. Recuerda que al subir fotos, borramos los datos GPS (EXIF) por tu seguridad.</p>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-8 border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-yellow/10 text-brand-yellow flex items-center justify-center shrink-0">
              <span className="font-black text-2xl">★</span>
            </div>
            <h2 className="text-2xl font-bold">Gamificación y Eventos</h2>
          </div>
          <div className="pl-16 space-y-4 text-black/70 dark:text-white/70 leading-relaxed">
            <p><strong>1. Exposiciones Temporales:</strong> Eventos temáticos con tiempo limitado. Puedes participar añadiendo sets de tu vitrina relacionados con el tema. Si la comunidad vota tu set y quedas en el Top, recibirás insignias permanentes para tu perfil.</p>
            <p><strong>2. Bounties (Misiones):</strong> El museo lanza misiones de búsqueda. Si tienes un set buscado, puedes "Reclamarlo" directamente seleccionándolo de tu vitrina (o subiéndolo como nuevo) y obtendrás grandes cantidades de Bricks.</p>
            <p><strong>3. Ranking y Votaciones:</strong> Durante las exposiciones, los visitantes otorgan Bricks a los sets que más les impresionan, generando un ranking en tiempo real de popularidad y calidad de conservación.</p>
            <p><strong>4. Participaciones e Historial:</strong> En tu menú superior tienes el área de "Participaciones". Allí podrás ver todo tu historial de eventos, gestionar y retirar tus sets de las exposiciones activas, y presumir de tu vitrina de Insignias ganadas.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
