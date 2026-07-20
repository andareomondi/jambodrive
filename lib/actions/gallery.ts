"use server";

import { createClient } from "@/lib/supabase/server";
import type { GalleryEvent } from "@/lib/services/gallery";

export async function createGalleryEvent(payload: {
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string;
}): Promise<GalleryEvent> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_events")
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteGalleryEvent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
