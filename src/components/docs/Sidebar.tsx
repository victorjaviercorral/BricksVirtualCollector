'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  sections: { slug: string; titulo: string }[];
}

export default function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header / Hamburger */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 sticky top-0 bg-paper dark:bg-paper-dark z-20">
        <span className="font-bold font-heading">Cómo funciona</span>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2" aria-label="Menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[64px] h-[calc(100vh-64px)] 
        w-64 bg-paper dark:bg-paper-dark lg:bg-transparent
        border-r border-black/10 dark:border-white/10
        transform transition-transform duration-300 ease-in-out z-40
        lg:translate-x-0 overflow-y-auto p-6
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="flex flex-col gap-2">
          {sections.map((section) => {
            const isActive = pathname === `/como-funciona/${section.slug}`;
            return (
              <Link
                key={section.slug}
                href={`/como-funciona/${section.slug}`}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive 
                    ? 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20' 
                    : 'text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                }`}
              >
                {section.titulo}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
