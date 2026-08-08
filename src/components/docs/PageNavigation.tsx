import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
  slug: string;
  titulo: string;
}

interface PageNavigationProps {
  prev: NavItem | null;
  next: NavItem | null;
}

export default function PageNavigation({ prev, next }: PageNavigationProps) {
  if (!prev && !next) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-8 border-t border-black/10 dark:border-white/10">
      {prev ? (
        <Link
          href={`/como-funciona/${prev.slug}`}
          className="flex flex-col gap-1 p-4 rounded-xl border border-black/10 dark:border-white/10 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors group"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 flex items-center gap-1">
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Anterior
          </span>
          <span className="font-heading font-medium text-black dark:text-white group-hover:text-brand-blue transition-colors">
            {prev.titulo}
          </span>
        </Link>
      ) : (
        <div /> // Placeholder
      )}

      {next ? (
        <Link
          href={`/como-funciona/${next.slug}`}
          className="flex flex-col gap-1 p-4 rounded-xl border border-black/10 dark:border-white/10 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors group text-right items-end"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50 flex items-center gap-1">
            Siguiente
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="font-heading font-medium text-black dark:text-white group-hover:text-brand-blue transition-colors">
            {next.titulo}
          </span>
        </Link>
      ) : (
        <div /> // Placeholder
      )}
    </div>
  );
}
