import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BadgeShowcase from './BadgeShowcase';
import {
  AGREGADOS_VACIOS,
  TOTAL_INSIGNIAS,
  evaluarInsignias,
  type AgregadosUsuario,
} from '@/lib/insignias-usuario';

const evaluar = (over: Partial<AgregadosUsuario> = {}) =>
  evaluarInsignias({ ...AGREGADOS_VACIOS, ...over });

describe('BadgeShowcase', () => {
  it('muestra el recuento real sobre el total del catálogo', () => {
    render(<BadgeShowcase insignias={evaluar({ numSets: 5 })} />);
    // 5 sets desbloquean coleccionista-1 y coleccionista-2.
    expect(screen.getByText(`2 de ${TOTAL_INSIGNIAS} desbloqueadas`)).toBeInTheDocument();
  });

  it('pinta cada insignia desbloqueada con su nombre', () => {
    render(<BadgeShowcase insignias={evaluar({ numSets: 5 })} />);
    expect(screen.getByText('Primera Pieza')).toBeInTheDocument();
    expect(screen.getByText('Estantería')).toBeInTheDocument();
  });

  it('un usuario sin insignias ve un estado vacío honesto, no una rejilla de casillas grises', () => {
    render(<BadgeShowcase insignias={evaluar()} />);
    expect(screen.getByText('Aún no has desbloqueado ninguna insignia')).toBeInTheDocument();
    expect(screen.getByText(`0 de ${TOTAL_INSIGNIAS} desbloqueadas`)).toBeInTheDocument();
  });

  it('muestra el próximo objetivo con su progreso cuando hay avance real', () => {
    render(<BadgeShowcase insignias={evaluar({ numFotos: 3 })} />);
    expect(screen.getByText('Tu próximo objetivo')).toBeInTheDocument();
    expect(screen.getByText('3 / 5 fotos')).toBeInTheDocument();
  });

  it('sin ningún avance no propone objetivos con barra', () => {
    render(<BadgeShowcase insignias={evaluar()} />);
    expect(screen.queryByText('Tu próximo objetivo')).not.toBeInTheDocument();
  });

  it('los criterios pendientes se listan como texto plegable, colapsado por defecto', () => {
    render(<BadgeShowcase insignias={evaluar()} />);
    const boton = screen.getByRole('button', { name: /Otras formas de ganar insignias/ });

    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Quedar 1º en una exposición/)).not.toBeInTheDocument();

    fireEvent.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Quedar 1º en una exposición/)).toBeInTheDocument();
  });

  it('el plegable anuncia cuántos criterios quedan', () => {
    const insignias = evaluar();
    render(<BadgeShowcase insignias={insignias} />);
    expect(
      screen.getByRole('button', { name: new RegExp(`\\(${insignias.otrasFamilias.length}\\)`) })
    ).toBeInTheDocument();
  });

  it('avisa cuando el total de piezas se queda corto y enlaza a Mesa de Trabajo', () => {
    render(<BadgeShowcase insignias={evaluar()} avisoPiezas="2 sets no tienen el nº de piezas informado." />);
    expect(screen.getByText(/2 sets no tienen el nº de piezas informado/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Completar en Mesa de Trabajo' })).toHaveAttribute(
      'href',
      '/mesa-de-trabajo'
    );
  });

  it('sin aviso no se pinta la nota de piezas incompletas', () => {
    render(<BadgeShowcase insignias={evaluar()} avisoPiezas={null} />);
    expect(screen.queryByRole('link', { name: 'Completar en Mesa de Trabajo' })).not.toBeInTheDocument();
  });

  it('una familia completa deja de aparecer entre los objetivos', () => {
    render(<BadgeShowcase insignias={evaluar({ numFotos: 500 })} />);
    expect(screen.getByText('Estudio Propio')).toBeInTheDocument();
    expect(screen.queryByText('5 / 5 fotos')).not.toBeInTheDocument();
  });
});
