"use client";

import ProximamentePanel from "./ProximamentePanel";

/**
 * Antes simulaba un grid de 40 bloques con propietarios y motivos inventados ("Simulamos que el
 * usuario logueado ha colocado 3 bloques"). Decisión D3 (Iteración 4): estado vacío honesto --
 * la mecánica del mosaico (qué es un bloque, cómo se gana, quién lo cura) no está diseñada
 * todavía. Ver ProximamentePanel.tsx.
 */
export default function CommunityMosaic() {
  return (
    <ProximamentePanel
      titulo="Mosaico Comunitario"
      descripcion="Un mural colaborativo con un bloque por cada hito de la comunidad está en diseño."
    />
  );
}
