import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export async function generateStaticParams() {
  return [
    { slug: 'politica-privacidad' },
    { slug: 'politica-cookies' },
    { slug: 'terminos-condiciones' },
    { slug: 'politica-propiedad-intelectual' },
    { slug: 'aviso-legal' }
  ];
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const allowedSlugs = [
    'politica-privacidad',
    'politica-cookies',
    'terminos-condiciones',
    'politica-propiedad-intelectual',
    'aviso-legal'
  ];

  if (!allowedSlugs.includes(slug)) {
    notFound();
  }

  const filePath = path.join(process.cwd(), 'legal', `${slug}.md`);
  
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-brand-blue hover:underline font-medium">
          &larr; Volver al inicio
        </Link>
        <div className="flex items-center gap-2 text-black/50 dark:text-white/50 text-sm font-medium">
          <ShieldCheck size={18} />
          <span>Documento Legal</span>
        </div>
      </div>
      
      <div className="glass p-8 sm:p-12 rounded-3xl shadow-lg prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-display prose-a:text-brand-blue max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
