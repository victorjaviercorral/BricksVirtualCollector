"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { CATALOGO_POR_SLUG } from "@/lib/insignias-usuario";

/**
 * Registra las insignias desbloqueadas y avisa de las nuevas.
 *
 * No renderiza nada. La Vitrina ya está pintada con el cálculo al vuelo cuando esto corre: aquí
 * solo se persiste (para tener fecha de obtención y alimentar el Mosaico Comunitario) y se avisa
 * de lo que se acaba de conseguir.
 *
 * Se hace desde el cliente, tras montar, y no durante el render del Server Component a
 * propósito: pintar una página no debe tener efectos de escritura. Si la llamada falla, la
 * página sigue siendo correcta -- lo único que se pierde es la fecha y el aviso, nunca la
 * insignia, porque la fuente de verdad es el cálculo, no la tabla.
 */

// Dedup a nivel de módulo: el doble efecto de StrictMode y un remonte del componente (Fast
// Refresh, re-render del padre) disparaban dos POST casi simultáneos. Mientras haya uno en
// vuelo, los siguientes montajes se enganchan a esa misma promesa en vez de lanzar otra
// petición. Al resolverse se limpia, así que una re-sincronización posterior legítima (el
// usuario vuelve a la página tras votar o reclamar) sí ocurre.
let sincronizacionEnCurso: Promise<string[]> | null = null;

function sincronizar(): Promise<string[]> {
  if (sincronizacionEnCurso) return sincronizacionEnCurso;

  sincronizacionEnCurso = (async () => {
    try {
      const res = await fetch("/api/insignias/sync", { method: "POST" });
      if (!res.ok) return [];
      const { nuevas } = (await res.json()) as { nuevas?: string[] };
      return nuevas ?? [];
    } catch {
      // Silencio deliberado: es una mejora, no un flujo crítico. Molestar con un error por algo
      // que el usuario no puede arreglar ni necesita saber sería ruido.
      return [];
    } finally {
      sincronizacionEnCurso = null;
    }
  })();

  return sincronizacionEnCurso;
}

export default function SincronizarInsignias() {
  useEffect(() => {
    let cancelado = false;

    sincronizar().then((nuevas) => {
      if (cancelado || nuevas.length === 0) return;
      nuevas.forEach((slug) => {
        const entrada = CATALOGO_POR_SLUG[slug];
        if (!entrada) return;
        toast.success(`¡Insignia desbloqueada: ${entrada.nombre}!`, {
          description: entrada.tramo ? `${entrada.familia} · nivel ${entrada.tramo}` : entrada.familia,
        });
      });
    });

    return () => {
      cancelado = true;
    };
  }, []);

  return null;
}
