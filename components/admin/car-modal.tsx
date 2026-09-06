"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Car as CarIcon,
  Save,
  Plus,
  X,
  Image as ImageIcon,
  Gauge,
  Settings2,
  Info,
  Loader2,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { uploadCarImage, uploadCarImages } from "@/lib/upload-image";
import { adminUpsertCar } from "@/lib/actions/admin-car";
import { cn } from "@/lib/utils";
import type { Car, TransmissionType, FuelType } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAR_TYPE_LABELS: Record<string, string> = {
  economy: "Economy",
  compact: "Compact",
  executive: "Executive",
  suv: "SUV",
  ssuv: "Luxury SUV",
  vans: "Vans",
  trucks: "Trucks",
};

const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  automatic: "Automatic",
  manual: "Manual",
};

const FUEL_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
};

const CURRENT_YEAR = new Date().getFullYear();

// ── Types ─────────────────────────────────────────────────────────────────────

interface CarFormData {
  name: string;
  model: string;
  year: number;
  price: number;
  type: string;
  seats: number;
  transmission: TransmissionType;
  fuel: FuelType;
  fuel_consumption: string;
  features: string;
  description: string;
  available: boolean;
  chauffeured: boolean;
}

interface CarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Car | null;
  mode?: "add" | "edit" | "duplicate";
  onSuccess?: () => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-border mb-4 mt-6 first:mt-0">
      <Icon className="w-4 h-4 text-accent" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

function SelectField({
  label,
  name,
  control,
  options,
}: {
  label: string;
  name: keyof CarFormData;
  control: any;
  options: Record<string, string>;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select.Root
            value={field.value as string}
            onValueChange={field.onChange}
          >
            <Select.Trigger className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-muted/40 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="z-[60] min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <Select.Viewport className="p-1">
                  {Object.entries(options).map(([v, l]) => (
                    <Select.Item
                      key={v}
                      value={v}
                      className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none data-[state=checked]:text-accent"
                    >
                      <Select.ItemText>{l}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CarModal({
  open,
  onOpenChange,
  car,
  mode = "add",
  onSuccess,
}: CarModalProps) {
  const abortRef = useRef<AbortController | null>(null);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");

  const isEditing = mode === "edit" && !!car;
  const isDuplicating = mode === "duplicate" && !!car;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CarFormData>({
    defaultValues: {
      name: "",
      model: "",
      year: CURRENT_YEAR,
      price: 0,
      type: "economy",
      seats: 5,
      transmission: "automatic",
      fuel: "petrol",
      fuel_consumption: "",
      features: "",
      description: "",
      available: true,
      chauffeured: false,
    },
  });

  // Populate form when editing or duplicating, reset when adding
  useEffect(() => {
    if (!open) {
      setPhase("idle");
      return;
    }

    if (car) {
      reset({
        name: isDuplicating ? `${car.name} (Copy)` : car.name,
        model: car.model,
        year: car.year,
        price: car.price,
        type: car.type ?? "economy",
        seats: car.seats,
        transmission: car.transmission,
        fuel: car.fuel,
        fuel_consumption: car.fuel_consumption ?? "",
        features: (car.features ?? []).join(", "),
        description: car.description ?? "",
        available: car.available ?? true,
        chauffeured: car.chauffeured ?? false,
      });
    } else {
      reset({
        name: "",
        model: "",
        year: CURRENT_YEAR,
        price: 0,
        type: "economy",
        seats: 5,
        transmission: "automatic",
        fuel: "petrol",
        fuel_consumption: "",
        features: "",
        description: "",
        available: true,
        chauffeured: false,
      });
    }
  }, [car, reset, open, isDuplicating]);

  const onSubmit = async (data: CarFormData) => {
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setIsLoading(true);
    setPhase("uploading");

    try {
      // ── 1. Upload cover image ──────────────────────────────────────────
      let coverUrl: string | null =
        isEditing || isDuplicating ? (car?.image ?? null) : null;
      if (coverFile) {
        coverUrl = await uploadCarImage(coverFile);
        if (signal.aborted) return;
      }

      // ── 2. Upload gallery images in parallel ───────────────────────────
      let galleryUrls: string[] =
        isEditing || isDuplicating ? (car?.images ?? []) : [];
      if (galleryFiles.length > 0) {
        const newUrls = await uploadCarImages(galleryFiles);
        if (signal.aborted) return;
        galleryUrls = [...galleryUrls, ...newUrls];
      }

      // ── 3. Upsert via server action ────────────────────────────────────
      setPhase("saving");

      const payload = {
        ...(isEditing && car ? { id: car.id } : {}),
        name: data.name,
        model: data.model,
        year: Number(data.year),
        price: Number(data.price),
        image: coverUrl,
        images: galleryUrls,
        type: data.type,
        seats: Number(data.seats),
        transmission: data.transmission,
        fuel: data.fuel,
        fuel_consumption: data.fuel_consumption || null,
        features: data.features
          ? data.features
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        description: data.description || null,
        available: data.available,
        chauffeured: data.chauffeured,
      };

      await adminUpsertCar(payload as any);

      if (signal.aborted) return;

      toast.success(
        isEditing
          ? "Car updated!"
          : isDuplicating
            ? "Car duplicated successfully!"
            : "Car added to fleet!",
      );

      setTimeout(() => {
        setCoverFile(null);
        setGalleryFiles([]);
        onOpenChange(false);
        onSuccess?.();
      }, 400);
    } catch (err: unknown) {
      if (signal.aborted) return;
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        setPhase("idle");
      }
    }
  };

  const handleCancel = () => {
    if (isLoading) {
      abortRef.current?.abort();
      setIsLoading(false);
      setPhase("idle");
      toast.info("Upload cancelled.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) handleCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[650px] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl border border-border bg-card shadow-xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="p-6 bg-muted/30 border-b border-border shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 text-accent-foreground animate-spin" />
                ) : (
                  <CarIcon className="h-6 w-6 text-accent-foreground" />
                )}
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-foreground">
                  {isEditing
                    ? "Update Vehicle"
                    : isDuplicating
                      ? "Duplicate Vehicle"
                      : "New Listing"}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {isEditing
                    ? `Editing ${car?.name} ${car?.model}`
                    : isDuplicating
                      ? `Creating a copy of ${car?.name} ${car?.model}`
                      : "Add a premium car to your fleet"}
                </Dialog.Description>
              </div>
              <Dialog.Close className="ml-auto rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            </div>
          </div>

          {/* ── Scrollable form body ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="car-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-1"
            >
              <SectionHeader icon={Settings2} title="Basic Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Brand Name
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g. Mercedes"
                    className="rounded-xl bg-muted/40 border-border h-11"
                    {...register("name", { required: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="model" className="text-xs font-semibold">
                    Model Variant
                  </Label>
                  <Input
                    id="model"
                    required
                    placeholder="e.g. C-Class"
                    className="rounded-xl bg-muted/40 border-border h-11"
                    {...register("model", { required: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Year</Label>
                  <Input
                    required
                    type="number"
                    className="rounded-xl bg-muted/40 border-border h-11"
                    {...register("year", {
                      required: true,
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Ksh / Day</Label>
                  <Input
                    required
                    type="number"
                    className="rounded-xl bg-muted/40 border-border h-11"
                    {...register("price", {
                      required: true,
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-semibold">Seats</Label>
                  <Input
                    required
                    type="number"
                    className="rounded-xl bg-muted/40 border-border h-11"
                    {...register("seats", {
                      required: true,
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              <SectionHeader icon={Gauge} title="Technical Specs" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectField
                  label="Category"
                  name="type"
                  control={control}
                  options={CAR_TYPE_LABELS}
                />
                <SelectField
                  label="Gearbox"
                  name="transmission"
                  control={control}
                  options={TRANSMISSION_LABELS}
                />
                <SelectField
                  label="Fuel"
                  name="fuel"
                  control={control}
                  options={FUEL_LABELS}
                />
              </div>
              <div className="space-y-1.5 mt-4">
                <Label className="text-xs font-semibold">
                  Fuel Consumption
                </Label>
                <Input
                  placeholder="e.g. 8.5L/100km"
                  className="rounded-xl bg-muted/40 border-border h-11"
                  {...register("fuel_consumption")}
                />
              </div>

              <SectionHeader icon={ImageIcon} title="Media & Extras" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Cover image */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    Main Photo
                    {coverFile && (
                      <span className="text-[10px] text-accent font-bold uppercase">
                        Selected
                      </span>
                    )}
                  </Label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) =>
                        setCoverFile(e.target.files?.[0] ?? null)
                      }
                    />
                    <div
                      className={cn(
                        "h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 transition-colors",
                        coverFile
                          ? "bg-accent/5 border-accent/40"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {coverFile ? coverFile.name : "Click to upload cover"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    Gallery
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {galleryFiles.length} file
                      {galleryFiles.length !== 1 ? "s" : ""}
                    </span>
                  </Label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) =>
                        setGalleryFiles(Array.from(e.target.files ?? []))
                      }
                    />
                    <div
                      className={cn(
                        "h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 transition-colors",
                        galleryFiles.length > 0
                          ? "bg-accent/5 border-accent/40"
                          : "hover:bg-muted/40",
                      )}
                    >
                      <Plus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {galleryFiles.length > 0
                          ? `${galleryFiles.length} selected`
                          : "Add gallery photos"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mt-4">
                <Label className="text-xs font-semibold">
                  Key Features (comma separated)
                </Label>
                <Input
                  placeholder="Bluetooth, Sunroof, AC..."
                  className="rounded-xl bg-muted/40 border-border h-11"
                  {...register("features")}
                />
              </div>

              <div className="space-y-1.5 mt-4">
                <Label className="text-xs font-semibold">Description</Label>
                <textarea
                  rows={3}
                  placeholder="Vehicle highlights..."
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  {...register("description")}
                />
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
                    <Info className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Visibility
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                      Show to customers
                    </p>
                  </div>
                </div>
                <Controller
                  name="available"
                  control={control}
                  render={({ field }) => (
                    <Switch.Root
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=checked]:bg-accent data-[state=unchecked]:bg-muted"
                    >
                      <Switch.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5" />
                    </Switch.Root>
                  )}
                />
              </div>

              {/* Service Mode Toggle */}
              <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
                    <CarIcon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Chauffeured Service
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                      Includes professional driver
                    </p>
                  </div>
                </div>
                <Controller
                  name="chauffeured"
                  control={control}
                  render={({ field }) => (
                    <Switch.Root
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=checked]:bg-accent data-[state=unchecked]:bg-muted"
                    >
                      <Switch.Thumb className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5" />
                    </Switch.Root>
                  )}
                />
              </div>
            </form>
          </div>

          {/* ── Upload status ──────────────────────────────────────────────── */}
          {isLoading && (
            <div className="px-6 py-3 bg-muted/30 border-t border-border shrink-0">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
                <p className="text-xs text-muted-foreground font-medium">
                  {phase === "uploading" && "Uploading media..."}
                  {phase === "saving" && "Saving to database..."}
                </p>
              </div>
            </div>
          )}

          {/* ── Action bar ─────────────────────────────────────────────────── */}
          <div className="p-4 border-t border-border bg-background flex gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 rounded-xl h-11 font-bold"
            >
              {isLoading ? "Cancel Upload" : "Cancel"}
            </Button>
            <Button
              type="submit"
              form="car-form"
              disabled={isLoading}
              className="flex-[2] bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {phase === "uploading" ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing
                    ? "Update Vehicle"
                    : isDuplicating
                      ? "Save Duplicate"
                      : "Create Listing"}
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
