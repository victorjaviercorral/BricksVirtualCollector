import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommunityMosaic from './CommunityMosaic';
import { bloquesMosaico, type BloqueMosaico } from '@/lib/insignias-usuario';

const bloque = (over: Partial<BloqueMosaico> = {}): BloqueMosaico => ({
  id: 'h1',
  slug: 'cantera-2',
  nombre: 'Cubo Lleno',
  familia: 'Cantera',
  eje: 'coleccion',
  icono: 'Blocks',
  tramo: 2,
  autor: 'builder',
  avatar: null,
  fecha: '2026-09-01T00:00:00.000Z',
  esMio: false,
  ...over,
});

describe('CommunityMosaic', () => {
  it('sin hitos muestra un estado vacío honesto, no un mural de casillas simuladas', () => {
    render(<CommunityMosaic bloques={[]} totalHitos={0} />);

    expect(screen.getByText('El mural está por empezar')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('pinta un bloque por hito real de la comunidad', () => {
    render(<CommunityMosaic bloques={[bloque(), bloque({ id: 'h2', autor: 'otra' })]} totalHitos={2} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('cada bloque describe qué insignia es, de quién y cuándo', () => {
    render(<CommunityMosaic bloques={[bloque()]} totalHitos={1} />);

    expect(
      screen.getByLabelText('Cubo Lleno — Cantera · nivel 2 — @builder — 1 sep 2026')
    ).toBeInTheDocument();
  });

  it('una insignia única se describe sin nivel', () => {
    render(<CommunityMosaic bloques={[bloque({ slug: 'oro', nombre: 'Oro', familia: 'Oro', tramo: null, icono: 'Trophy' })]} totalHitos={1} />);

    expect(screen.getByLabelText('Oro — Oro — @builder — 1 sep 2026')).toBeInTheDocument();
  });

  it('un hito sin fecha no inventa una', () => {
    render(<CommunityMosaic bloques={[bloque({ fecha: null })]} totalHitos={1} />);

    expect(screen.getByLabelText('Cubo Lleno — Cantera · nivel 2 — @builder')).toBeInTheDocument();
  });

  it('cuenta cuántos hitos del mural son del propio usuario', () => {
    render(
      <CommunityMosaic
        bloques={[bloque({ esMio: true }), bloque({ id: 'h2', esMio: true }), bloque({ id: 'h3' })]}
        totalHitos={3}
      />
    );

    expect(screen.getByText(/3 hitos conseguidos/)).toBeInTheDocument();
    expect(screen.getByText('2 son tuyos')).toBeInTheDocument();
  });

  it('sin hitos propios no presume de ninguno', () => {
    render(<CommunityMosaic bloques={[bloque()]} totalHitos={1} />);

    expect(screen.getByText(/1 hito conseguido/)).toBeInTheDocument();
    expect(screen.queryByText(/tuyos?$/)).not.toBeInTheDocument();
  });

  it('avisa de que solo se muestran los más recientes cuando hay más de los que caben', () => {
    render(<CommunityMosaic bloques={[bloque()]} totalHitos={500} />);

    expect(screen.getByText('Se muestran los 1 más recientes.')).toBeInTheDocument();
  });

  it('no avisa de recorte cuando se están mostrando todos', () => {
    render(<CommunityMosaic bloques={[bloque()]} totalHitos={1} />);

    expect(screen.queryByText(/más recientes/)).not.toBeInTheDocument();
  });

  it('sin props cae al estado vacío en vez de romper', () => {
    render(<CommunityMosaic />);

    expect(screen.getByText('El mural está por empezar')).toBeInTheDocument();
  });
});

describe('bloquesMosaico', () => {
  const fila = (over: Record<string, unknown> = {}) => ({
    id: 'h1',
    insignia: 'cantera-2',
    otorgado_en: '2026-09-01T00:00:00.000Z',
    usuario_id: 'u2',
    usuarios_perfil: { username: 'builder', avatar_url: null },
    ...over,
  });

  it('resuelve nombre, familia e icono desde el catálogo a partir del slug guardado', () => {
    const [b] = bloquesMosaico([fila()], 'u1');

    expect(b.nombre).toBe('Cubo Lleno');
    expect(b.familia).toBe('Cantera');
    expect(b.icono).toBe('Blocks');
    expect(b.tramo).toBe(2);
  });

  it('marca como propios los hitos del usuario que mira', () => {
    const bloques = bloquesMosaico([fila({ usuario_id: 'u1' }), fila({ id: 'h2', usuario_id: 'u2' })], 'u1');

    expect(bloques[0].esMio).toBe(true);
    expect(bloques[1].esMio).toBe(false);
  });

  it('sin usuario identificado ningún bloque es propio', () => {
    expect(bloquesMosaico([fila({ usuario_id: 'u1' })], null)[0].esMio).toBe(false);
  });

  it('descarta filas cuyo slug ya no está en el catálogo en vez de pintarlas sin nombre', () => {
    expect(bloquesMosaico([fila({ insignia: 'insignia-retirada' })], 'u1')).toHaveLength(0);
  });

  it('normaliza usuarios_perfil tanto si llega como objeto como si llega como array', () => {
    const comoArray = bloquesMosaico([fila({ usuarios_perfil: [{ username: 'array', avatar_url: 'a.jpg' }] })], 'u1');

    expect(comoArray[0].autor).toBe('array');
    expect(comoArray[0].avatar).toBe('a.jpg');
  });

  it('un hito sin perfil asociado no queda anónimo con un hueco', () => {
    expect(bloquesMosaico([fila({ usuarios_perfil: null })], 'u1')[0].autor).toBe('Coleccionista');
  });

  it('una lista nula devuelve un mural vacío', () => {
    expect(bloquesMosaico(null, 'u1')).toEqual([]);
  });
});
