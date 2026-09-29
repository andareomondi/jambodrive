"use server";

import { createClient } from "@/lib/supabase/server";

export interface GalleryEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string;
  created_at: string;
}

export async function getGalleryEvents(page = 0, limit = 12): Promise<GalleryEvent[]> {
  const supabase = await createClient();
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("gallery_events")
    .select("*")
    .order("event_date", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`getGalleryEvents: ${error.message}`);
  return data ?? [];
}

export async function getCarGalleryImages(page = 0, limit = 12): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("car-images")
      .list("cars", {
        limit: limit,
        offset: page * limit,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error || !data) return [];

    return data
      .filter((f) => f.name && !f.name.startsWith("."))
      .map((f) => {
        const { data: urlData } = supabase.storage
          .from("car-images")
          .getPublicUrl(`cars/${f.name}`);
        return urlData.publicUrl;
      });
  } catch {
    return [];
  }
}

export async function deleteGalleryEvent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_events")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteGalleryEvent: ${error.message}`);
}