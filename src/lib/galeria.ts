/**
 * Lógica pura de la Galería (/galeria): el índice navegable de vitrinas públicas. Extraída para
 * probar el filtro por temática y la derivación de datos de tarjeta sin mockear Supabase.
 */

export const PORTADA_RESERVA =
  "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop";

interface SetAnidado {
  id: string;
  tematica?: string | null;
  fotos?: { url: string }[] | null;
}

export interface VitrinaCruda {
  id: string;
  nombre: string;
  descripcion?: string | null;
  usuarios_perfil?:
    | { username?: string | null; alias?: string | null }
    | { username?: string | null; alias?: string | null }[]
    | null;
  sets?: SetAnidado[] | null;
}

export interface TarjetaVitrina {
  id: string;
  nombre: string;
  descripcion: string | null;
  dueno: string;
  portada: string;
  numSets: number;
  temas: string[];
}

function normalizarTema(t: string | null | undefined): string | null {
  const limpio = (t || "").trim();
  return limpio.length > 0 ? limpio : null;
}

/** Lista ordenada de temáticas presentes en las vitrinas, sin duplicados ni vacíos. */
export function temasDeVitrinas(vitrinas: VitrinaCruda[] | null | undefined): string[] {
  const set = new Set<string>();
  (vitrinas || []).forEach((v) => {
    (v.sets || []).forEach((s) => {
      const tema = normalizarTema(s.tematica);
      if (tema) set.add(tema);
    });
  });
  return [...set].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

/** Convierte una vitrina cruda en los datos que pinta la tarjeta de la galería. */
export function tarjetaVitrina(vitrina: VitrinaCruda): TarjetaVitrina {
  const perfil = Array.isArray(vitrina.usuarios_perfil)
    ? vitrina.usuarios_perfil[0]
    : vitrina.usuarios_perfil;
  const sets = vitrina.sets || [];
  const portada = sets.map((s) => s.fotos?.[0]?.url).find(Boolean) || PORTADA_RESERVA;
  const temas = [...new Set(sets.map((s) => normalizarTema(s.tematica)).filter((t): t is string => !!t))].sort(
    (a, b) => a.localeCompare(b, "es", { sensitivity: "base" })
  );

  return {
    id: vitrina.id,
    nombre: vitrina.nombre,
    descripcion: vitrina.descripcion?.trim() || null,
    dueno: perfil?.alias || perfil?.username || "Coleccionista anónimo",
    portada,
    numSets: sets.length,
    temas,
  };
}

/**
 * Filtra las vitrinas por temática. `tema` null o "todas" devuelve todas. Una vitrina coincide si
 * alguno de sus sets tiene esa temática.
 */
export function filtrarVitrinasPorTema(
  vitrinas: VitrinaCruda[] | null | undefined,
  tema: string | null
): VitrinaCruda[] {
  const lista = vitrinas || [];
  if (!tema || tema === "todas") return lista;
  return lista.filter((v) =>
    (v.sets || []).some((s) => normalizarTema(s.tematica) === tema)
  );
}
