import { getDocSections } from '@/lib/docs';
import Sidebar from '@/components/docs/Sidebar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cómo funciona | Lego Virtual Museum',
  description: 'Documentación de usuario y funcionamiento de Lego Virtual Museum',
};

export default function ComoFuncionaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sections = getDocSections().map((s) => ({ slug: s.slug, titulo: s.titulo }));

  return (
    <div className="min-h-screen flex flex-col bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark selection:bg-brand-blue/20">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar sections={sections} />
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
