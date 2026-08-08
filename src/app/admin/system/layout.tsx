'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActivityIcon, Server, TerminalSquare, BookOpen } from 'lucide-react';

export default function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Health & Status', path: '/admin/system/health', icon: Server },
    { name: 'Logs', path: '/admin/system/logs', icon: TerminalSquare },
    { name: 'Runbook', path: '/admin/system/docs', icon: BookOpen },
  ];

  return (
    <div className="flex flex-col gap-8">
      
      {/* HEADER TABS BRUTALISTAS */}
      <div className="bg-panel border-2 border-foreground rounded-2xl p-4 shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-brand-red rounded-xl border-2 border-foreground flex items-center justify-center text-white">
            <ActivityIcon size={20} />
          </div>
          <div>
            <h1 className="font-display font-black text-xl leading-none">System Control</h1>
            <p className="text-xs font-bold text-foreground/60 mt-1 uppercase">Sysadmin Only</p>
          </div>
        </div>

        <nav className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-foreground font-bold text-sm whitespace-nowrap transition-all hover:-translate-y-1 ${isActive ? 'bg-brand-blue text-white shadow-[2px_2px_0px_0px_#0F172A] dark:shadow-[2px_2px_0px_0px_#F8F9FA]' : 'bg-transparent shadow-none hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <item.icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* MAIN CONTENT (Con fondo normal para no romper los componentes dark que ya hicimos, o adaptándolos) */}
      <div className="bg-slate-950 text-slate-200 rounded-3xl border-2 border-foreground shadow-[4px_4px_0px_0px_#0F172A] dark:shadow-[4px_4px_0px_0px_#F8F9FA] p-6 md:p-8 overflow-hidden relative">
        {/* Usamos bg-slate-950 para envolver las vistas de logs y health porque las diseñamos con modo oscuro (tailwind bg-slate-900 text-white) */}
        {children}
      </div>

    </div>
  );
}
