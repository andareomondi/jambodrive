import type { Metadata } from "next";
import { Suspense } from "react";
import { getGalleryEvents, getCarGalleryImages } from "@/lib/services/gallery";
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

async function GalleryContent() {
  const limit = 12; // Number of items per page
  const [carImages, events] = await Promise.all([
    getCarGalleryImages(0, limit),
    getGalleryEvents(0, limit).catch(() => []),
  ]);

  return (
    <GalleryClient 
      initialCarImages={carImages} 
      initialEvents={events} 
      limit={limit} 
    />
  );
}

export default function GalleryPage() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <GalleryContent />
      </Suspense>
    </main>
  );
}