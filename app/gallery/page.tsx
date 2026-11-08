import type { Metadata } from "next";
import { Suspense } from "react";
import { getGalleryEvents, getCarGalleryImages } from "@/lib/services/gallery";
import { GalleryClient } from "@/components/gallery/gallery-client";

export const revalidate = 900; // Enable ISR for fast edge delivery

export const metadata: Metadata = {
  title: "Gallery | Cosmara Car Hire",
  description:
    "Browse our premium fleet and see highlights from Cosmara events across Kenya.",
  openGraph: {
    title: "Gallery | Cosmara Car Hire",
    description: "Fleet photos and event highlights from Cosmara.",
    type: "website",
    images: ["/hero/car1.webp"],
  },
};

async function GalleryContent() {
  const limit = 12;
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
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-[70vh] flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <GalleryContent />
      </Suspense>
    </main>
  );
}
