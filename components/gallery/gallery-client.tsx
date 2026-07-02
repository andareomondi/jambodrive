"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ImageIcon,
  ZoomIn,
} from "lucide-react";
import type { GalleryEvent } from "@/lib/services/gallery";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "fleet" | "events";

interface LightboxItem {
  src: string;
  alt: string;
  caption?: string;
  date?: string | null;
}

interface GalleryClientProps {
  carImages: string[];
  events: GalleryEvent[];
}

// ── Masonry column splitter ───────────────────────────────────────────────────
// Splits items into N columns in reading order so the layout
// fills naturally without JS-measured heights.

function splitIntoColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => columns[i % cols].push(item));
  return columns;
}

// ── Aspect ratio helper — alternates tall/wide for visual variety ─────────────

function getAspectClass(index: number): string {
  const pattern = [
    "aspect-[3/4]", // portrait
    "aspect-[4/3]", // landscape
    "aspect-square", // square
    "aspect-[3/4]", // portrait
    "aspect-[16/9]", // wide
    "aspect-square", // square
  ];
  return pattern[index % pattern.length];
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  startIndex,
  onClose,
}: {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const current = items[index];

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + items.length) % items.length),
    [items.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % items.length),
    [items.length],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tabular-nums">
        {index + 1} / {items.length}
      </p>

      {/* Prev */}
      {items.length > 1 && (
        <button
          className="absolute left-3 sm:left-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-full max-w-4xl flex items-center justify-center"
        style={{ height: "75vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          className="object-contain select-none"
          sizes="(max-width: 768px) 100vw, 90vw"
          priority
        />
      </div>

      {/* Next */}
      {items.length > 1 && (
        <button
          className="absolute right-3 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Caption */}
      {(current.caption || current.date) && (
        <div
          className="mt-4 text-center max-w-xl px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {current.caption && (
            <p className="text-white font-semibold text-sm sm:text-base">
              {current.caption}
            </p>
          )}
          {current.date && (
            <p className="text-white/50 text-xs mt-1 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(current.date).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={cn(
                "relative w-10 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all",
                i === index
                  ? "border-accent scale-110"
                  : "border-white/20 opacity-50 hover:opacity-80",
              )}
              aria-label={`Go to image ${i + 1}`}
            >
              <Image
                src={item.src}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Fleet masonry ─────────────────────────────────────────────────────────────

function FleetMasonry({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="font-semibold text-foreground">No fleet images yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload car photos via the admin panel to populate this gallery.
        </p>
      </div>
    );
  }

  // 1 col mobile, 2 col tablet, 3 col desktop
  const cols2 = splitIntoColumns(images, 2);
  const cols3 = splitIntoColumns(images, 3);

  return (
    <>
      {/* Mobile: 2 columns */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {cols2.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-2">
            {col.map((src, ri) => {
              const globalIdx = ri * 2 + ci;
              return (
                <button
                  key={src}
                  onClick={() => onOpen(globalIdx)}
                  className="group relative w-full aspect-square rounded-xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  aria-label={`View fleet image ${globalIdx + 1}`}
                >
                  <Image
                    src={src}
                    alt={`Fleet image ${globalIdx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="50vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

{/* Tablet+: Pure CSS Masonry Column Layout */}
<div className="hidden sm:block [column-count:2] lg:[column-count:3] [column-gap:12px]">
  {images.map((src, globalIdx) => {
    // We can still use alternating aspect ratios safely here
    const aspect = getAspectClass(globalIdx);
    
    return (
      <div key={src} className="break-inside-avoid mb-3">
        <button
          onClick={() => onOpen(globalIdx)}
          className={cn(
            "group relative w-full rounded-xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
            aspect,
          )}
          aria-label={`View fleet image ${globalIdx + 1}`}
        >
          <Image
            src={src}
            alt={`Fleet image ${globalIdx + 1}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
              <ZoomIn className="w-5 h-5 text-white" />
            </div>
          </div>
        </button>
      </div>
    );
  })}
</div>

    </>
  );
}

// ── Events grid ───────────────────────────────────────────────────────────────

function EventsGrid({
  events,
  onOpen,
}: {
  events: GalleryEvent[];
  onOpen: (index: number) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="font-semibold text-foreground">No events yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Event photos added via the admin panel will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {events.map((event, i) => (
        <button
          key={event.id}
          onClick={() => onOpen(i)}
          className="group relative rounded-2xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 text-left"
          aria-label={`View event: ${event.title}`}
        >
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay always present */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Zoom hint */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Caption pinned to bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-semibold text-white text-sm sm:text-base leading-snug line-clamp-2">
              {event.title}
            </p>
            {event.event_date && (
              <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(event.event_date).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            {event.description && (
              <p className="text-white/60 text-xs mt-1.5 line-clamp-2 hidden sm:block">
                {event.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GalleryClient({ carImages, events }: GalleryClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("fleet");
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  const fleetItems: LightboxItem[] = carImages.map((src, i) => ({
    src,
    alt: `Fleet image ${i + 1}`,
  }));

  const eventItems: LightboxItem[] = events.map((e) => ({
    src: e.image_url,
    alt: e.title,
    caption: e.title,
    date: e.event_date,
  }));

  const openFleet = (index: number) =>
    setLightbox({ items: fleetItems, index });
  const openEvents = (index: number) =>
    setLightbox({ items: eventItems, index });

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "fleet", label: "Our Fleet", count: carImages.length },
    { id: "events", label: "Events", count: events.length },
  ];

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="relative py-20 sm:py-28 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl">
              <p className="text-accent font-semibold text-sm uppercase tracking-widest mb-3">
                Visual Stories
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Our Gallery
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                Explore our premium fleet in detail and relive moments from our
                events across Kenya.
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold",
                      activeTab === tab.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {activeTab === "fleet" && (
            <FleetMasonry images={carImages} onOpen={openFleet} />
          )}
          {activeTab === "events" && (
            <EventsGrid events={events} onOpen={openEvents} />
          )}
        </div>
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
