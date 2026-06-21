"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, X, Loader2, Calendar, Save } from "lucide-react";
import { uploadCarImage } from "@/lib/upload-image";
import { createGalleryEvent } from "@/lib/actions/gallery";
import { cn } from "@/lib/utils";
import type { GalleryEvent } from "@/lib/services/gallery";

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
}

interface EventImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (event: GalleryEvent) => void;
}

export function EventImageModal({
  open,
  onOpenChange,
  onSuccess,
}: EventImageModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>();

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    reset();
    setImageFile(null);
    setImagePreview(null);
    setPhase("idle");
    onOpenChange(false);
  };

  const onSubmit = async (data: EventFormData) => {
    if (!imageFile) {
      toast.error("Please select an image for this event.");
      return;
    }

    setIsLoading(true);
    try {
      setPhase("uploading");
      const imageUrl = await uploadCarImage(imageFile);
      console.log(imageUrl);

      setPhase("saving");
      const event = await createGalleryEvent({
        title: data.title,
        description: data.description || null,
        event_date: data.event_date || null,
        image_url: imageUrl,
      });

      toast.success("Event image added to gallery!");
      onSuccess(event);
      handleClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save event.");
    } finally {
      setIsLoading(false);
      setPhase("idle");
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <Dialog.Title className="font-bold text-foreground">
                  Add Event Photo
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                  Publish to the public gallery
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6 space-y-5">
              {/* Image upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Event Photo
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] ?? null)
                    }
                    disabled={isLoading}
                  />
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-accent/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">
                          Click to change
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "w-full h-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-muted/40 transition-colors",
                      )}
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Click to upload event photo
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        JPEG, PNG, WebP — max 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Nairobi Safari Rally 2025"
                  className="rounded-xl bg-muted/40 border-border h-11"
                  disabled={isLoading}
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="event_date"
                  className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" /> Event Date
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  className="rounded-xl bg-muted/40 border-border h-11"
                  disabled={isLoading}
                  {...register("event_date")}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  Description
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Brief description shown on the gallery card..."
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  disabled={isLoading}
                  {...register("description")}
                />
              </div>

              {/* Upload progress text */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
                  {phase === "uploading" && "Uploading image..."}
                  {phase === "saving" && "Saving to gallery..."}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl h-11"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                disabled={isLoading || !imageFile}
                className="flex-[2] bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                    {phase === "uploading" ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Publish to Gallery
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
