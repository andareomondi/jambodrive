import { createClient } from "@/lib/supabase/server";

export interface GalleryEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string;
  created_at: string;
}

export async function getGalleryEvents(): Promise<GalleryEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) throw new Error(`getGalleryEvents: ${error.message}`);
  return data ?? [];
}

export async function deleteGalleryEvent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_events")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteGalleryEvent: ${error.message}`);
}
