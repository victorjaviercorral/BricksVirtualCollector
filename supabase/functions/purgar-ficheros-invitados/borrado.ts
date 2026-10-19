// Lógica de la Edge Function purgar-ficheros-invitados (incidente CI-2026-004), sin dependencias de
// Deno ni de supabase-js para poder probarla con Vitest. `index.ts` la conecta con el cliente real.
//
// Lee por lotes la cola public.storage_borrados_pendientes, agrupa por bucket y borra con la Storage
// API (storage.from(bucket).remove(rutas)). Si el borrado de un bucket va bien, quita esas filas de la
// cola; si falla, las deja y anota el error para la siguiente pasada nocturna (no reintenta aquí).

export interface FilaPendiente {
  id: number;
  bucket_id: string;
  ruta: string;
}

export interface OperacionesBorrado {
  /** Filas de la cola con id > despuesDeId, por id ascendente, como mucho `limite`. */
  leerPendientes(limite: number, despuesDeId: number): Promise<FilaPendiente[]>;
  /** Borra con la Storage API. Devuelve el mensaje de error o null si ha ido bien. */
  borrarFicheros(bucket: string, rutas: string[]): Promise<string | null>;
  /** Quita de la cola las filas ya borradas. */
  marcarHechos(ids: number[]): Promise<void>;
  /** Deja las filas en la cola con el error del intento. */
  marcarFallidos(ids: number[], error: string): Promise<void>;
}

export interface ResumenBorrado {
  procesados: number;
  borrados: number;
  fallidos: number;
  errores: string[];
}

/** Tope de rutas por llamada a remove() (la Storage API acepta hasta 1000). */
export const TAMANO_LOTE = 100;
/** Tope de lotes por invocación, para no pasar del tiempo máximo de una Edge Function. */
export const MAX_LOTES = 50;

export function agruparPorBucket(filas: FilaPendiente[]): Map<string, FilaPendiente[]> {
  const grupos = new Map<string, FilaPendiente[]>();
  for (const fila of filas) {
    const grupo = grupos.get(fila.bucket_id);
    if (grupo) grupo.push(fila);
    else grupos.set(fila.bucket_id, [fila]);
  }
  return grupos;
}

export async function borrarFicherosPendientes(
  op: OperacionesBorrado,
  opciones: { tamanoLote?: number; maxLotes?: number } = {},
): Promise<ResumenBorrado> {
  const tamanoLote = opciones.tamanoLote ?? TAMANO_LOTE;
  const maxLotes = opciones.maxLotes ?? MAX_LOTES;
  const resumen: ResumenBorrado = { procesados: 0, borrados: 0, fallidos: 0, errores: [] };

  // Cursor por id: las filas que fallan se quedan en la cola y no se vuelven a leer en esta pasada.
  let ultimoId = 0;
  for (let lote = 0; lote < maxLotes; lote++) {
    const filas = await op.leerPendientes(tamanoLote, ultimoId);
    if (filas.length === 0) break;
    ultimoId = filas[filas.length - 1].id;
    resumen.procesados += filas.length;

    for (const [bucket, grupo] of agruparPorBucket(filas)) {
      const ids = grupo.map((f) => f.id);
      const error = await op.borrarFicheros(bucket, grupo.map((f) => f.ruta));
      if (error === null) {
        await op.marcarHechos(ids);
        resumen.borrados += grupo.length;
      } else {
        await op.marcarFallidos(ids, error);
        resumen.fallidos += grupo.length;
        resumen.errores.push(`${bucket}: ${error}`);
      }
    }

    if (filas.length < tamanoLote) break;
  }

  return resumen;
}
