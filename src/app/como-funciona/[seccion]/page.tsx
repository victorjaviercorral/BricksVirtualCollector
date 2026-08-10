import { notFound } from 'next/navigation';
import { getDocSections, getDocSectionBySlug } from '@/lib/docs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Breadcrumb from '@/components/docs/Breadcrumb';
import TableOfContents from '@/components/docs/TableOfContents';
import AnchorHeading from '@/components/docs/AnchorHeading';
import PageNavigation from '@/components/docs/PageNavigation';
import DocDiagram from '@/components/docs/DocDiagram';

export const dynamicParams = false;

export async function generateStaticParams() {
  const sections = getDocSections();
  return sections.map((section) => ({
    seccion: section.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ seccion: string }> }) {
  const resolvedParams = await params;
  const section = getDocSectionBySlug(resolvedParams.seccion);
  if (!section) return { title: 'No encontrado' };

  return {
    title: `${section.titulo} | Cómo funciona | BricksVirtualCollector`,
    description: section.resumen,
  };
}

export default async function DocSectionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const resolvedParams = await params;
  const section = getDocSectionBySlug(resolvedParams.seccion);

  if (!section) {
    notFound();
  }

  const sections = getDocSections();
  const currentIndex = sections.findIndex((s) => s.slug === section.slug);
  
  const prev = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const next = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  return (
    <div className="flex flex-col xl:flex-row w-full px-6 py-8 md:py-12 lg:px-12">
      {/* Central Content */}
      <div className="flex-1 max-w-3xl min-w-0">
        <Breadcrumb title={section.titulo} />
        
        <h1 className="text-3xl md:text-4xl font-heading font-black mb-4 tracking-tight">
          {section.titulo}
        </h1>
        
        {/* Contenido Markdown */}
        <div className="prose prose-lg dark:prose-invert prose-headings:font-heading prose-a:text-brand-blue hover:prose-a:text-brand-blue/80 prose-strong:font-bold mt-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <AnchorHeading level={2} className="text-2xl mt-12 mb-6 font-bold">{children}</AnchorHeading>,
              h3: ({ children }) => <AnchorHeading level={3} className="text-xl mt-8 mb-4 font-bold">{children}</AnchorHeading>,
              // Custom list styling required by contract (imperative/bolding logic is just regular markdown rendering)
              ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 my-6">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 my-6">{children}</ol>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-8">
                  <table className="w-full text-sm text-left border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="px-4 py-3 bg-black/5 dark:bg-white/5 font-bold border border-black/10 dark:border-white/10">{children}</th>,
              td: ({ children }) => <td className="px-4 py-3 border border-black/10 dark:border-white/10">{children}</td>,
              pre: ({ children, ...props }: any) => {
                const child = Array.isArray(children) ? children[0] : children;
                if (child?.props?.className?.includes('language-diagram')) {
                  return <>{children}</>;
                }
                return <pre {...props}>{children}</pre>;
              },
              code: ({ className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || '');
                if (match && match[1] === 'diagram') {
                  const type = String(children).replace(/\n$/, '');
                  return <DocDiagram type={type} />;
                }
                return <code className={className} {...props}>{children}</code>;
              },
            }}
          >
            {section.content}
          </ReactMarkdown>
        </div>

        <PageNavigation 
          prev={prev ? { slug: prev.slug, titulo: prev.titulo } : null}
          next={next ? { slug: next.slug, titulo: next.titulo } : null} 
        />
      </div>

      {/* Right Sidebar (Table of Contents) */}
      <TableOfContents />
    </div>
  );
}
