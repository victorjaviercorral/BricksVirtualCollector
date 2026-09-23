import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TourProvider } from "@/components/tour/TourProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerInvitado } from "@/components/BannerInvitado";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

// Hallazgo E8 del preflight (docs/09-lanzamiento/preflight-2026-09-21.md): sin metadataBase,
// Open Graph ni Twitter Card. Sin esto, compartir un enlace en LinkedIn/Twitter/Slack no muestra
// ni imagen ni descripción -- justo la audiencia a la que apunta este prototipo de portfolio.
const TITULO = "BricksVirtualCollector";
const DESCRIPCION = "Museo virtual para coleccionistas de LEGO®. Exhibición anónima y segura de colecciones. Proyecto independiente, no afiliado a The LEGO Group.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: SITE_URL,
    siteName: TITULO,
    locale: "es_ES",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: TITULO }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('usuarios_perfil')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TourProvider isAuthed={!!user}>
            <Navbar user={user} profile={profile} />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
              {user?.is_anonymous && <BannerInvitado />}
              {children}
            </main>
            <Footer />
          </TourProvider>
          <Toaster position="bottom-center" toastOptions={{ className: "font-sans rounded-xl glass border-white/20" }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
