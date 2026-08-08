"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveAction(formData: FormData) {
  const supabaseAction = await createClient();
  const id = formData.get("id") as string;
  if (!id) return;
  
  await supabaseAction.from("exposicion_sets").update({ estado: "aprobado" }).eq("id", id);
  revalidatePath("/admin/moderacion");
}

export async function rejectAction(formData: FormData) {
  const supabaseAction = await createClient();
  const id = formData.get("id") as string;
  if (!id) return;
  
  await supabaseAction.from("exposicion_sets").update({ estado: "rechazado" }).eq("id", id);
  revalidatePath("/admin/moderacion");
}
