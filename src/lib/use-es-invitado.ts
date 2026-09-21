"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * ¿La sesión actual es de invitado (sesión anónima de Supabase, ADR-011)? Fuente única para los
 * componentes que deben adaptar su UI: un invitado no puede publicar (la RLS de `vitrinas`
 * rechaza `visibilidad = 'pública'`, migración 20260909110000), así que ofrecerle "Pública" solo
 * lleva a un error de política de seguridad. Es una ayuda de UX: la garantía sigue siendo la RLS.
 */
export function useEsInvitado(): boolean {
  const [esInvitado, setEsInvitado] = useState(false);

  useEffect(() => {
    let vivo = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (vivo) setEsInvitado(data?.user?.is_anonymous === true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  return esInvitado;
}
