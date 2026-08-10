"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Roles con permiso de moderación. Coincide deliberadamente con la comprobación ya existente en
 * src/app/admin/moderacion/page.tsx ("admin" | "admin_exposiciones"), no con la lista más amplia
 * de src/app/admin/layout.tsx (que además incluye "sysadmin" para mostrar el enlace en el
 * sidebar). Esa diferencia ya existía antes de este cambio -- un sysadmin ve el enlace a
 * Moderación pero page.tsx lo redirige fuera al entrar -- y no se corrige aquí para no alterar
 * comportamiento de producto sin que sea el objetivo de este cambio; queda anotado como hallazgo
 * menor en docs/05-plan/seguimiento-iteracion-3.md.
 */
const MODERATOR_ROLES = ["admin", "admin_exposiciones"];

/**
 * Verifica que el usuario autenticado tiene un rol de moderador antes de permitir la acción.
 *
 * Hasta ahora estas Server Actions eran invocables por cualquiera con sesión iniciada -- la
 * única barrera era que admin/layout.tsx (un Client Component) redirigía en el navegador a
 * quien no fuera admin, lo cual no protege nada del lado servidor: una petición POST directa al
 * endpoint de la Server Action, sin pasar por la UI, la ejecutaba igualmente. Cierra los
 * hallazgos S2 de docs/auditoria-arquitectura.md.
 */
async function isModerator(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("usuarios_perfil")
    .select("role")
    .eq("id", user.id)
    .single();

  return !!profile?.role && MODERATOR_ROLES.includes(profile.role);
}

export async function approveAction(formData: FormData) {
  const supabaseAction = await createClient();
  const id = formData.get("id") as string;
  if (!id) return;

  if (!(await isModerator(supabaseAction))) return;

  await supabaseAction.from("exposicion_sets").update({ estado: "aprobado" }).eq("id", id);
  revalidatePath("/admin/moderacion");
}

export async function rejectAction(formData: FormData) {
  const supabaseAction = await createClient();
  const id = formData.get("id") as string;
  if (!id) return;

  if (!(await isModerator(supabaseAction))) return;

  await supabaseAction.from("exposicion_sets").update({ estado: "rechazado" }).eq("id", id);
  revalidatePath("/admin/moderacion");
}
