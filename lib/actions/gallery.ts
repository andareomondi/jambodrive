"use server";

import { ADMIN_ROLES, requireRole } from "@/lib/auth/require-role";
import type { GalleryEvent } from "@/lib/services/gallery";

export async function createGalleryEvent(payload: {
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string;
}): Promise<GalleryEvent> {
  const { supabase } = await requireRole(ADMIN_ROLES);

  const title = payload.title?.trim();
  const image_url = payload.image_url?.trim();
  if (!title || !image_url) {
    throw new Error("A title and image are required.");
  }

  const { data, error } = await supabase
    .from("gallery_events")
    .insert([{ ...payload, title, image_url }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteGalleryEvent(id: string): Promise<void> {
  const { supabase } = await requireRole(ADMIN_ROLES);
  const { error } = await supabase.from("gallery_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
