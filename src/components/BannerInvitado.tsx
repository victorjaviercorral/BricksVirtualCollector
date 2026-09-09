"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { UpgradeCuentaModal } from "./UpgradeCuentaModal";

/**
 * Banner persistente de modo invitado (Fase 4, ADR-011). Se monta en el layout raíz cuando
 * `user.is_anonymous`, así que un invitado lo ve en cada carga hasta que hace upgrade. No es
 * descartable a propósito: su función es recordar que la sesión caduca.
 */
export function BannerInvitado() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        role="status"
        className="mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-sm"
      >
        <FlaskConical size={18} className="text-brand-green shrink-0" />
        <p className="text-black/70 dark:text-white/70 flex-1">
          Estás en <strong className="text-brand-green">modo demo</strong>. Tu colección se borra a
          las 48&nbsp;h y no es pública.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 self-start sm:self-auto bg-brand-green text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Guárdala creando una cuenta
        </button>
      </div>
      <UpgradeCuentaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
