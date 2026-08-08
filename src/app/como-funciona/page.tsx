import { redirect } from 'next/navigation';
import { getDocSections } from '@/lib/docs';

export default function ComoFuncionaIndex() {
  const sections = getDocSections();
  
  if (sections.length > 0) {
    redirect(`/como-funciona/${sections[0].slug}`);
  }

  // Fallback if no docs are found
  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl font-heading font-bold mb-4">Cómo funciona</h1>
      <p className="text-black/60 dark:text-white/60">
        No se encontró documentación en este momento.
      </p>
    </div>
  );
}
