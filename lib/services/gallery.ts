// ============================================================
// lib/services/gallery.ts
// Server-side queries for gallery_events table.
// Run this SQL in Supabase first:
//
// create table public.gallery_events (
//   id uuid default gen_random_uuid() primary key,
//   title text not null,
//   description text,
//   event_date date,
//   image_url text not null,
//   created_at timestamptz default now()
// );
// alter table public.gallery_events enable row level security;
// create policy "Public read" on public.gallery_events
//   for select using (true);
// create policy "Admin insert/update/delete" on public.gallery_events
//   for all using (
//     exists (
//       select 1 from profiles
//       where profiles.id = auth.uid()
//       and profiles.role = 'super_admin'
//     )
//   );
// ============================================================

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