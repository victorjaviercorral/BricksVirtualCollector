import MesaTrabajoClient from "@/components/MesaTrabajoClient";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default function MesaTrabajoPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <MesaTrabajoClient />
    </Suspense>
  );
}