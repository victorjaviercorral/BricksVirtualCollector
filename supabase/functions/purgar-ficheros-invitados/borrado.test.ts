import { describe, expect, it } from 'vitest';
import {
  agruparPorBucket,
  borrarFicherosPendientes,
  type FilaPendiente,
  type OperacionesBorrado,
} from './borrado';

// Cola en memoria que imita la tabla public.storage_borrados_pendientes y un Storage con ficheros.
// Las operaciones son dobles de la frontera (BD y Storage API); la lógica bajo prueba es la de borrado.ts.
function crearEntorno(filas: FilaPendiente[], fallarBucket?: string) {
  const cola = new Map(filas.map((f) => [f.id, { ...f, ultimo_error: null as string | null }]));
  const storage = new Set(filas.map((f) => `${f.bucket_id}/${f.ruta}`));
  const llamadasRemove: Array<{ bucket: string; rutas: string[] }> = [];

  const op: OperacionesBorrado = {
    async leerPendientes(limite, despuesDeId) {
      return [...cola.values()]
        .filter((f) => f.id > despuesDeId)
        .sort((a, b) => a.id - b.id)
        .slice(0, limite)
        .map(({ id, bucket_id, ruta }) => ({ id, bucket_id, ruta }));
    },
    async borrarFicheros(bucket, rutas) {
      llamadasRemove.push({ bucket, rutas });
      if (bucket === fallarBucket) return 'Bucket not found';
      for (const r of rutas) storage.delete(`${bucket}/${r}`);
      return null;
    },
    async marcarHechos(ids) {
      for (const id of ids) cola.delete(id);
    },
    async marcarFallidos(ids, error) {
      for (const id of ids) cola.get(id)!.ultimo_error = error;
    },
  };
  return { op, cola, storage, llamadasRemove };
}

const fila = (id: number, bucket_id: string, ruta: string): FilaPendiente => ({ id, bucket_id, ruta });

describe('agruparPorBucket', () => {
  it('agrupa las rutas por bucket conservando el orden', () => {
    const grupos = agruparPorBucket([
      fila(1, 'fotos_sets', 'u1/a.jpg'),
      fila(2, 'avatars', 'u1/avatar.png'),
      fila(3, 'fotos_sets', 'u2/b.jpg'),
    ]);
    expect([...grupos.keys()]).toEqual(['fotos_sets', 'avatars']);
    expect(grupos.get('fotos_sets')!.map((f) => f.ruta)).toEqual(['u1/a.jpg', 'u2/b.jpg']);
  });
});

describe('borrarFicherosPendientes', () => {
  it('con la cola vacía no llama a la Storage API', async () => {
    const { op, llamadasRemove } = crearEntorno([]);
    const resumen = await borrarFicherosPendientes(op);
    expect(resumen).toEqual({ procesados: 0, borrados: 0, fallidos: 0, errores: [] });
    expect(llamadasRemove).toHaveLength(0);
  });

  it('borra cada bucket con una llamada a remove y vacía la cola', async () => {
    const { op, cola, storage, llamadasRemove } = crearEntorno([
      fila(1, 'fotos_sets', 'u1/a.jpg'),
      fila(2, 'avatars', 'u1/avatar.png'),
      fila(3, 'fotos_sets', 'u1/b.jpg'),
    ]);
    const resumen = await borrarFicherosPendientes(op);
    expect(resumen).toEqual({ procesados: 3, borrados: 3, fallidos: 0, errores: [] });
    expect(llamadasRemove).toEqual([
      { bucket: 'fotos_sets', rutas: ['u1/a.jpg', 'u1/b.jpg'] },
      { bucket: 'avatars', rutas: ['u1/avatar.png'] },
    ]);
    expect(cola.size).toBe(0);
    expect(storage.size).toBe(0);
  });

  it('si falla un bucket deja sus filas en cola con el error y sigue con los demás', async () => {
    const { op, cola, storage } = crearEntorno(
      [fila(1, 'fotos_sets', 'u1/a.jpg'), fila(2, 'avatars', 'u1/avatar.png')],
      'avatars',
    );
    const resumen = await borrarFicherosPendientes(op);
    expect(resumen.borrados).toBe(1);
    expect(resumen.fallidos).toBe(1);
    expect(resumen.errores).toEqual(['avatars: Bucket not found']);
    expect([...cola.keys()]).toEqual([2]);
    expect(cola.get(2)!.ultimo_error).toBe('Bucket not found');
    expect(storage.has('avatars/u1/avatar.png')).toBe(true);
    expect(storage.has('fotos_sets/u1/a.jpg')).toBe(false);
  });

  it('procesa por lotes y no vuelve a leer en la misma pasada las filas que fallaron', async () => {
    const filas = [
      fila(1, 'roto', 'u1/x.jpg'),
      fila(2, 'fotos_sets', 'u1/a.jpg'),
      fila(3, 'fotos_sets', 'u1/b.jpg'),
      fila(4, 'fotos_sets', 'u1/c.jpg'),
      fila(5, 'fotos_sets', 'u1/d.jpg'),
    ];
    const { op, cola, llamadasRemove } = crearEntorno(filas, 'roto');
    const resumen = await borrarFicherosPendientes(op, { tamanoLote: 2 });
    expect(resumen.procesados).toBe(5);
    expect(resumen.borrados).toBe(4);
    expect(resumen.fallidos).toBe(1);
    // 3 lotes: [1,2], [3,4], [5]; la fila 1 (fallida) no se relee.
    expect(llamadasRemove.filter((l) => l.bucket === 'roto')).toHaveLength(1);
    expect([...cola.keys()]).toEqual([1]);
  });

  it('respeta el tope de lotes por invocación y deja el resto para la siguiente', async () => {
    const filas = Array.from({ length: 5 }, (_, i) => fila(i + 1, 'fotos_sets', `u1/${i}.jpg`));
    const { op, cola } = crearEntorno(filas);
    const resumen = await borrarFicherosPendientes(op, { tamanoLote: 2, maxLotes: 2 });
    expect(resumen.borrados).toBe(4);
    expect([...cola.keys()]).toEqual([5]);
  });

  it('propaga el error si no se puede leer la cola', async () => {
    const { op } = crearEntorno([]);
    op.leerPendientes = async () => {
      throw new Error('Leyendo la cola: permission denied');
    };
    await expect(borrarFicherosPendientes(op)).rejects.toThrow('permission denied');
  });
});
