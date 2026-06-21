"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventImageModal } from "@/components/admin/event-image-modal";
import { deleteGalleryEvent } from "@/lib/actions/gallery";
import { Plus, Trash2, Calendar, ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { GalleryEvent } from "@/lib/services/gallery";

interface AdminGallerySectionProps {
  initialEvents?: GalleryEvent[];
}

export function AdminGallerySection({
  initialEvents,
}: AdminGallerySectionProps) {
  const [events, setEvents] = useState<GalleryEvent[]>(initialEvents ?? []);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (event: GalleryEvent) => {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    setDeletingId(event.id);
    try {
      await deleteGalleryEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      toast.success("Event removed from gallery.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Gallery — Events
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage event photos shown on the public gallery page.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/gallery" target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> View Gallery
            </Button>
          </Link>
          <Button
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-none bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Event Photo
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 sm:p-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground">No event photos yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Add your first event photo and it will appear on the public
              gallery.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="mt-5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Event Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="group relative rounded-2xl overflow-hidden border border-border bg-muted hover:shadow-md transition-all duration-200"
              >
                {/* Image */}
                <div className="relative aspect-[4/3]">
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Delete button — appears on hover */}
                  <button
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-sm text-foreground line-clamp-1">
                    {event.title}
                  </p>
                  {event.event_date && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.event_date).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <EventImageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={(event) => setEvents((prev) => [event, ...prev])}
      />
    </Card>
  );
}
