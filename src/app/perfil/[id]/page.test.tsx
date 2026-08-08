import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerfilPublico from './page';
import { MOCK_USER, MOCK_SETS } from '@/lib/data';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }
}));

vi.mock('framer-motion/client', () => ({
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock React 19 `use` hook because JSDOM/Testing library might not fully support it without experimental flags
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    use: (promise: any) => {
      // Simulate synchronous resolution of the promise for test environments
      if (promise instanceof Promise) {
        let result: any;
        promise.then(v => { result = v; });
        // En un entorno mock real podríamos usar use() real si React 19 está activo,
        // pero para JSDOM interceptamos devolviendo el valor esperado
        // Para este test en concreto pasaremos params mockeados sincrónicamente
        return { id: '123' };
      }
      return promise;
    }
  };
});

describe('PerfilPublico Page', () => {
  const mockParams = Promise.resolve({ id: '123' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la cabecera del perfil correctamente', () => {
    render(<PerfilPublico params={mockParams} />);
    
    expect(screen.getByText(MOCK_USER.alias)).toBeInTheDocument();
    expect(screen.getByText(`#${MOCK_USER.id}`)).toBeInTheDocument();
    expect(screen.getByText(MOCK_USER.totalSets.toString())).toBeInTheDocument();
  });

  it('renderiza la colección pública (MOCK_SETS)', () => {
    render(<PerfilPublico params={mockParams} />);
    
    MOCK_SETS.forEach(set => {
      expect(screen.getByText(set.name)).toBeInTheDocument();
    });
  });

  it('abre y controla el carrusel de la visita guiada', () => {
    render(<PerfilPublico params={mockParams} />);
    
    // Iniciar Visita Guiada
    const startButton = screen.getByRole('button', { name: /Iniciar Visita Guiada/i });
    fireEvent.click(startButton);

    // Debería mostrar la primera imagen
    const firstSet = MOCK_SETS[0];
    expect(screen.getAllByText(firstSet.name)[0]).toBeInTheDocument();
    
    const images = screen.getAllByAltText(firstSet.name);
    expect(images[0]).toHaveAttribute('src', firstSet.image);

    // Navegar adelante
    // find buttons inside the overlay. The next button is the one with right chevron
    // there are multiple buttons, let's find it by the second button that has no text (it's the chevronRight)
    const buttons = screen.getAllByRole('button');
    // En el DOM del tour hay 3 botones: Close, Prev, Next
    // Iniciar visita ya no está en contexto principal clickeable si está en modal fullscreen, pero en JSDOM coexisten
    // Close = index 0 in modal, Prev = index 1, Next = index 2
    
    const nextBtn = buttons.find(b => b.innerHTML.includes('lucide-chevron-right'));
    fireEvent.click(nextBtn!);

    // Debería mostrar la segunda imagen
    const secondSet = MOCK_SETS[1];
    expect(screen.getAllByAltText(secondSet.name)[0]).toBeInTheDocument();

    // Navegar atrás
    const prevBtn = buttons.find(b => b.innerHTML.includes('lucide-chevron-left'));
    fireEvent.click(prevBtn!);
    
    // Vuelve a la primera
    expect(screen.getAllByAltText(firstSet.name)[0]).toBeInTheDocument();

    // Cerrar tour
    const closeBtn = buttons.find(b => b.innerHTML.includes('lucide-x'));
    fireEvent.click(closeBtn!);

    // Para asegurar que se cerró:
    expect(screen.queryByText(/Vitrina 1 de/)).not.toBeInTheDocument();
  });
});
