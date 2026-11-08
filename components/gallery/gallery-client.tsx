"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { AppImage } from "@/components/ui/app-image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ImageIcon,
  ZoomIn,
  Loader2,
} from "lucide-react";
import {
  type GalleryEvent,
  getCarGalleryImages,
  getGalleryEvents,
} from "@/lib/services/gallery";
import { cn } from "@/lib/utils";

type Tab = "fleet" | "events";

interface LightboxItem {
  src: string;
  alt: string;
  caption?: string;
  date?: string | null;
}

interface GalleryClientProps {
  initialCarImages: string[];
  initialEvents: GalleryEvent[];
  limit?: number;
}

function splitIntoColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => columns[i % cols].push(item));
  return columns;
}

function getAspectClass(index: number): string {
  const pattern = [
    "aspect-[3/4]",
    "aspect-[4/3]",
    "aspect-square",
    "aspect-[3/4]",
    "aspect-[16/9]",
    "aspect-square",
  ];
  return pattern[index % pattern.length];
}

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="w-5 h-5" />
      </button>

      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-xs font-semibold tabular-nums tracking-widest z-10">
        {index + 1} / {items.length}
      </p>

      {items.length > 1 && (
        <button
          className="absolute left-3 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div
        className="relative w-full max-w-5xl flex items-center justify-center my-auto"
        style={{ height: "72vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <AppImage
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          className="object-contain select-none rounded-lg"
          sizes="(max-width: 1200px) 100vw, 90vw"
          priority
        />
      </div>

      {items.length > 1 && (
        <button
          className="absolute right-3 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {(current.caption || current.date) && (
        <div
          className="mt-4 text-center max-w-xl px-4 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {current.caption && (
            <p className="text-white font-bold text-base sm:text-lg">
              {current.caption}
            </p>
          )}
          {current.date && (
            <p className="text-white/60 text-xs mt-1 flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              {new Date(current.date).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FleetMasonry({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (index: number) => void;
}) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-3xl bg-secondary/20">
        <ImageIcon className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="font-semibold text-foreground text-base">
          No fleet images yet
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Upload car photos via the admin panel to populate this gallery.
        </p>
      </div>
    );
  }

  const cols2 = splitIntoColumns(images, 2);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {cols2.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-3">
            {col.map((src, ri) => {
              const globalIdx = ri * 2 + ci;
              return (
                <button
                  key={src}
                  onClick={() => onOpen(globalIdx)}
                  className="group relative w-full aspect-square rounded-2xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label={`View fleet image ${globalIdx + 1}`}
                >
                  <AppImage
                    src={src}
                    alt={`Fleet image ${globalIdx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="50vw"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hidden sm:block [column-count:2] lg:[column-count:3] [column-gap:16px]">
        {images.map((src, globalIdx) => {
          const aspect = getAspectClass(globalIdx);

          return (
            <div key={src} className="break-inside-avoid mb-4">
              <button
                onClick={() => onOpen(globalIdx)}
                className={cn(
                  "group relative w-full rounded-2xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-accent shadow-xs hover:shadow-xl transition-all",
                  aspect,
                )}
                aria-label={`View fleet image ${globalIdx + 1}`}
              >
                <AppImage
                  src={src}
                  alt={`Fleet image ${globalIdx + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-lg">
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

function EventsGrid({
  events,
  onOpen,
}: {
  events: GalleryEvent[];
  onOpen: (index: number) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-3xl bg-secondary/20">
        <Calendar className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <p className="font-semibold text-foreground text-base">No events yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Event photos added via the admin panel will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, i) => (
        <button
          key={event.id}
          onClick={() => onOpen(i)}
          className="group relative rounded-2xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-accent text-left border border-border/60 hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-300"
          aria-label={`View event: ${event.title}`}
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/40">
            <AppImage
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-md">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-1.5">
              {event.event_date && (
                <p className="text-accent text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.event_date).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
              <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-white/70 text-xs line-clamp-2 pt-0.5">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function GalleryClient({
  initialCarImages,
  initialEvents,
  limit = 12,
}: GalleryClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("fleet");
  const [lightbox, setLightbox] = useState<{
    items: LightboxItem[];
    index: number;
  } | null>(null);

  const [carImages, setCarImages] = useState<string[]>(initialCarImages);
  const [carPage, setCarPage] = useState<number>(0);
  const [hasMoreCars, setHasMoreCars] = useState<boolean>(
    initialCarImages.length >= limit,
  );

  const [events, setEvents] = useState<GalleryEvent[]>(initialEvents);
  const [eventPage, setEventPage] = useState<number>(0);
  const [hasMoreEvents, setHasMoreEvents] = useState<boolean>(
    initialEvents.length >= limit,
  );

  const [isPending, startTransition] = useTransition();

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

  const handleLoadMore = () => {
    startTransition(async () => {
      if (activeTab === "fleet") {
        const nextPage = carPage + 1;
        const newImages = await getCarGalleryImages(nextPage, limit);
        setCarImages((prev) => [...prev, ...newImages]);
        setCarPage(nextPage);
        setHasMoreCars(newImages.length >= limit);
      } else {
        const nextPage = eventPage + 1;
        const newEvents = await getGalleryEvents(nextPage, limit);
        setEvents((prev) => [...prev, ...newEvents]);
        setEventPage(nextPage);
        setHasMoreEvents(newEvents.length >= limit);
      }
    });
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "fleet", label: "Our Fleet", count: carImages.length },
    { id: "events", label: "Events & Highlights", count: events.length },
  ];

  const hasMore = activeTab === "fleet" ? hasMoreCars : hasMoreEvents;

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* ── Hero Banner ── */}
        <div className="relative py-20 sm:py-24 overflow-hidden border-b border-border/40 bg-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl space-y-3">
              <span className="inline-block px-3.5 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold uppercase tracking-wider">
                Visual Stories
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                Our Gallery
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Explore our pristine fleet in detail and relive moments from our
                exclusive client events across Kenya.
              </p>
            </div>
          </div>
        </div>

        {/* ── Sticky Tab Bar ── */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                      activeTab === tab.id
                        ? "bg-accent-foreground/20 text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Gallery Content View ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {activeTab === "fleet" && (
            <FleetMasonry images={carImages} onOpen={openFleet} />
          )}
          {activeTab === "events" && (
            <EventsGrid events={events} onOpen={openEvents} />
          )}

          {/* ── Load More Action ── */}
          {hasMore && (
            <div className="mt-14 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-accent-foreground font-bold text-sm rounded-xl hover:bg-accent/90 shadow-md focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Loading More..." : "Load More Photos"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox Overlay ── */}
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
