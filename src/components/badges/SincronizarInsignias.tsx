"use client";

import { useEffect, useRef } from "react";
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
export default function SincronizarInsignias() {
  // En modo estricto de React el efecto se ejecuta dos veces en desarrollo. El upsert es
  // idempotente, así que no duplicaría filas, pero sí mostraría el aviso por duplicado.
  const yaLanzado = useRef(false);

  useEffect(() => {
    if (yaLanzado.current) return;
    yaLanzado.current = true;

    let cancelado = false;

    (async () => {
      try {
        const res = await fetch("/api/insignias/sync", { method: "POST" });
        if (!res.ok) return;

        const { nuevas } = (await res.json()) as { nuevas?: string[] };
        if (cancelado || !nuevas?.length) return;

        nuevas.forEach((slug) => {
          const entrada = CATALOGO_POR_SLUG[slug];
          if (!entrada) return;
          toast.success(`¡Insignia desbloqueada: ${entrada.nombre}!`, {
            description: entrada.tramo ? `${entrada.familia} · nivel ${entrada.tramo}` : entrada.familia,
          });
        });
      } catch {
        // Silencio deliberado: es una mejora, no un flujo crítico. Molestar con un error por algo
        // que el usuario no puede arreglar ni necesita saber sería ruido.
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return null;
}
