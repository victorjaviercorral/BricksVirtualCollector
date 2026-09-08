import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecompensasGanadas from './RecompensasGanadas';
import type { ReclamoBounty } from '@/lib/queries/insignias-usuario';

const reclamo = (over: Partial<ReclamoBounty> = {}): ReclamoBounty => ({
  id: 'r1',
  nombre_set: 'Castillo de Hogwarts',
  recompensa: 1000,
  creado_en: '2026-08-02T00:00:00.000Z',
  set_id: 's1',
  sets: { id: 's1', nombre: 'Mi Hogwarts' },
  ...over,
});

describe('RecompensasGanadas', () => {
  it('sin reclamos explica de qué van los retos y enlaza al tablero', () => {
    render(<RecompensasGanadas reclamos={[]} />);

    expect(screen.getByText('Todavía no has reclamado ningún reto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver retos abiertos' })).toHaveAttribute('href', '/bounties');
  });

  it('suma los Bricks realmente concedidos, que es lo que guarda cada reclamo', () => {
    render(<RecompensasGanadas reclamos={[reclamo(), reclamo({ id: 'r2', recompensa: 500 })]} />);

    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
    expect(screen.getByText('Bricks ganados')).toBeInTheDocument();
  });

  it('explica dónde acaban los Bricks, para que el total de bricks recibidos cuadre', () => {
    render(<RecompensasGanadas reclamos={[reclamo()]} />);

    expect(
      screen.getByText(/van directos al set con el que lo reclamaste/)
    ).toBeInTheDocument();
  });

  it('cada reclamo enlaza a su detalle en la nueva ruta', () => {
    render(<RecompensasGanadas reclamos={[reclamo()]} />);

    expect(screen.getByRole('link', { name: 'Castillo de Hogwarts' })).toHaveAttribute(
      'href',
      '/dashboard/insignias/bounty/r1'
    );
  });

  it('muestra con qué set se reclamó y enlaza a su ficha', () => {
    render(<RecompensasGanadas reclamos={[reclamo()]} />);

    expect(screen.getByRole('link', { name: 'Mi Hogwarts' })).toHaveAttribute('href', '/set/s1');
    expect(screen.getByText(/2 ago 2026/)).toBeInTheDocument();
  });

  it('un reclamo antiguo sin set asociado lo dice, en vez de dejar un enlace roto', () => {
    render(<RecompensasGanadas reclamos={[reclamo({ sets: null, set_id: null })]} />);

    expect(screen.getByText(/Reclamo anterior al registro del set/)).toBeInTheDocument();
  });

  it('normaliza la relación sets tanto si llega como objeto como si llega como array', () => {
    render(<RecompensasGanadas reclamos={[reclamo({ sets: [{ id: 's9', nombre: 'Set Array' }] })]} />);

    expect(screen.getByRole('link', { name: 'Set Array' })).toHaveAttribute('href', '/set/s9');
  });

  it('habla siempre de Bricks, nunca de "pts": es lo que de verdad se concede', () => {
    const { container } = render(<RecompensasGanadas reclamos={[reclamo()]} />);

    expect(screen.getByText('+1.000 Bricks')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bpts\b/i);
  });

  it('un reclamo sin recompensa registrada muestra 0, no un valor inventado', () => {
    render(<RecompensasGanadas reclamos={[reclamo({ recompensa: null })]} />);

    expect(screen.getByText('+0 Bricks')).toBeInTheDocument();
  });

  it('un reclamo sin nombre de reto no queda en blanco', () => {
    render(<RecompensasGanadas reclamos={[reclamo({ nombre_set: null })]} />);

    expect(screen.getByRole('link', { name: 'Reto de la comunidad' })).toBeInTheDocument();
  });

  it('sin props cae al estado vacío en vez de romper', () => {
    render(<RecompensasGanadas />);

    expect(screen.getByText('Todavía no has reclamado ningún reto')).toBeInTheDocument();
  });
});
