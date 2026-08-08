import fs from 'fs';
import path from 'path';

export interface DocSection {
  slug: string;
  titulo: string;
  orden: number;
  resumen: string;
  content: string;
}

const docsDirectory = path.join(process.cwd(), 'docs/09-guia-usuario');

export function getDocSections(): DocSection[] {
  if (!fs.existsSync(docsDirectory)) return [];

  const fileNames = fs.readdirSync(docsDirectory);
  const sections = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const fullPath = path.join(docsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Simple frontmatter parser
      const match = fileContents.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      let titulo = '';
      let orden = 0;
      let resumen = '';
      let content = fileContents;

      if (match) {
        const frontmatter = match[1];
        content = match[2].trim();
        
        const titleMatch = frontmatter.match(/titulo:\s*(.*)/);
        if (titleMatch) titulo = titleMatch[1].trim();
        
        const orderMatch = frontmatter.match(/orden:\s*(\d+)/);
        if (orderMatch) orden = parseInt(orderMatch[1].trim(), 10);
        
        const summaryMatch = frontmatter.match(/resumen:\s*(.*)/);
        if (summaryMatch) resumen = summaryMatch[1].trim();
      }

      // Generate slug removing the leading number (e.g., "01-que-es.md" -> "que-es")
      const slug = fileName.replace(/^\d+-/, '').replace(/\.md$/, '');

      return {
        slug,
        titulo,
        orden,
        resumen,
        content,
      };
    });

  // Sort by order
  return sections.sort((a, b) => a.orden - b.orden);
}

export function getDocSectionBySlug(slug: string): DocSection | undefined {
  const sections = getDocSections();
  return sections.find((section) => section.slug === slug);
}
