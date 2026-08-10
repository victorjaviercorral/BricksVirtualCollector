import { getDocSections } from '@/lib/docs';
import Sidebar from '@/components/docs/Sidebar';

export const metadata = {
  title: 'Cómo funciona | BricksVirtualCollector',
  description: 'Documentación de usuario y funcionamiento de BricksVirtualCollector',
};

export default function ComoFuncionaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sections = getDocSections().map((s) => ({ slug: s.slug, titulo: s.titulo }));

  return (
    <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-8 bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark rounded-3xl p-4 lg:p-8 min-h-[80vh]">
      <Sidebar sections={sections} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
