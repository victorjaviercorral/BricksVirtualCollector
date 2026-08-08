'use client';

import { Link as LinkIcon, Check } from 'lucide-react';
import { useState, ReactNode, Children } from 'react';

// Genera un slug a partir de los hijos de React (texto)
function generateSlug(children: ReactNode): string {
  const text = Children.toArray(children).join('');
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface AnchorHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

export default function AnchorHeading({ level, children, className = '' }: AnchorHeadingProps) {
  const [copied, setCopied] = useState(false);
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const id = generateSlug(children);

  const copyToClipboard = async () => {
    const url = new URL(window.location.href);
    url.hash = id;
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <Tag id={id} className={`group relative flex items-center ${className} scroll-mt-24`} tabIndex={-1}>
      {children}
      <button
        onClick={copyToClipboard}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2 p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-all text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white outline-none focus:ring-2 focus:ring-brand-blue"
        aria-label="Copiar enlace a esta sección"
        title="Copiar enlace"
      >
        {copied ? <Check size={18} className="text-brand-green" /> : <LinkIcon size={18} />}
      </button>
    </Tag>
  );
}
