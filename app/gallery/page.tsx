import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getGalleryEvents } from "@/lib/services/gallery";
import { GalleryClient } from "@/components/gallery/gallery-client";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse our premium fleet and see highlights from Cosmara events across Kenya.",
  openGraph: {
    title: "Gallery | Cosmara Car Hire",
    description: "Fleet photos and event highlights from Cosmara.",
    type: "website",
  },
};

async function getCarGalleryImages(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("car-images")
      .list("cars", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

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

async function GalleryContent() {
  const [carImages, events] = await Promise.all([
    getCarGalleryImages(),
    getGalleryEvents().catch(() => []),
  ]);

  return <GalleryClient carImages={carImages} events={events} />;
}

export default function GalleryPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading gallery...</div>}>
        <GalleryContent />
      </Suspense>
    </main>
  );
}