"use client";

import ProximamentePanel from "./ProximamentePanel";

/**
 * Antes mostraba 4 logros inventados de un supuesto total de 24 ("2/24 Desbloqueadas"), sin
 * ninguna tabla ni criterio real detrás. Decisión D3 (Iteración 4): estado vacío honesto en vez
 * de datos simulados -- diseñar el sistema de logros es un producto nuevo, fuera de esta
 * iteración. Ver ProximamentePanel.tsx.
 */
export default function BadgeShowcase() {
  return (
    <ProximamentePanel
      titulo="Vitrina de Insignias"
      descripcion="Un sistema de logros por hitos de la comunidad está en diseño. Mientras tanto, tus insignias reales de exposiciones ya viven en la pestaña Pasaporte."
    />
  );
}
