import { getVitrinasPublicas } from "@/lib/queries/vitrinas";
import { temasDeVitrinas, type VitrinaCruda } from "@/lib/galeria";
import GaleriaClient from "./GaleriaClient";

/**
 * Galería pública de vitrinas (/galeria). La superficie "Explorar" que faltaba: hasta ahora solo
 * se llegaba a una vitrina concreta desde la home o el feed del Hub, nunca a un índice navegable.
 * Es el destino de "Explorador Virtual" y "Ver Galería Completa" de la home y de la celda
 * "Comunidad" del Hub.
 */
export default async function GaleriaPage() {
  const vitrinas = (await getVitrinasPublicas()) as VitrinaCruda[];
  const temas = temasDeVitrinas(vitrinas);

  return <GaleriaClient vitrinas={vitrinas} temas={temas} />;
}
