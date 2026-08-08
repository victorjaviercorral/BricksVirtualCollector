'use client';

import { useEffect, useState } from 'react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from the DOM after render
    const elements = Array.from(document.querySelectorAll('.prose h2, .prose h3'));
    const items: TOCItem[] = elements.map((el) => ({
      id: el.id,
      text: el.textContent || '',
      level: el.tagName === 'H2' ? 2 : 3,
    }));
    setHeadings(items);

    if (items.length > 0) {
      setActiveId(items[0].id);
    }

    // Scroll spy
    const observer = new IntersectionObserver(
      (entries) => {
        // Encontrar el último elemento visible (el que está más arriba en el viewport)
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Si hay varios, cogemos el primero (el que está más arriba)
          setActiveId(visibleEntries[0].target.id);
        }
      },
      { rootMargin: '0px 0px -80% 0px' } // Se activa cuando cruza el 20% superior
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Move focus for accessibility
      element.focus();
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }

      element.scrollIntoView({
        behavior: isReduced ? 'auto' : 'smooth',
      });
      // Actualizar la URL sin recargar
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block w-64 shrink-0 pl-8" aria-label="Tabla de contenidos">
      <div className="sticky top-[100px] border-l-2 border-black/5 dark:border-white/5 pl-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40 mb-4">
          En esta página
        </h4>
        <ul className="space-y-3">
          {headings.map((heading) => (
            <li key={heading.id} className={`${heading.level === 3 ? 'ml-4' : ''}`}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={`text-sm transition-colors block ${
                  activeId === heading.id
                    ? 'text-brand-blue font-bold'
                    : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
