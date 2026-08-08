import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  title: string;
}

export default function Breadcrumb({ title }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-black/50 dark:text-white/50 mb-6 font-mono">
      <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">
        Inicio
      </Link>
      <ChevronRight size={14} className="mx-2" />
      <Link href="/como-funciona" className="hover:text-black dark:hover:text-white transition-colors">
        Cómo funciona
      </Link>
      <ChevronRight size={14} className="mx-2" />
      <span className="text-black dark:text-white truncate max-w-[200px] sm:max-w-xs" aria-current="page">
        {title}
      </span>
    </nav>
  );
}
