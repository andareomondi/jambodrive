"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  Save,
  Plus,
  X,
  Image as ImageIcon,
  Gauge,
  Settings2,
  Info,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { uploadCarImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

type CarType =
  | "economy"
  | "compact"
  | "executive"
  | "suv"
  | "ssuv"
  | "vans"
  | "safari"
  | "wedding"
  | "wagon";
type TransmissionType = "automatic" | "manual";
type FuelType = "petrol" | "diesel" | "electric" | "hybrid";

interface CarFormData {
  name: string;
  model: string;
  year: number;
  price: number;
  image: string;
  images: string;
  type: CarType;
  seats: number;
  transmission: TransmissionType;
  fuel: FuelType;
  fuel_consumption: string;
  features: string;
  description: string;
  available: boolean;
}

interface Car {
  id: string;
  name: string;
  model: string;
  year: number;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  type: CarType;
  seats: number;
  transmission: TransmissionType;
  fuel: FuelType;
  fuel_consumption: string;
  features: string[];
  description: string;
  available: boolean;
}

interface CarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Car | null;
  onSuccess?: () => void;
}

const carTypeLabels: Record<CarType, string> = {
  economy: "Economy",
  compact: "Compact",
  executive: "Executive",
  suv: "SUV",
  ssuv: "Luxury SUV",
  vans: "Vans",
  safari: "Safari",
  wedding: "Wedding & Events",
  wagon: "Wagon",
};
const transmissionLabels: Record<TransmissionType, string> = {
  automatic: "Automatic",
  manual: "Manual",
};
const fuelLabels: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  hybrid: "Hybrid",
};
const currentYear = new Date().getFullYear();

export function CarModal({
  open,
  onOpenChange,
  car,
  onSuccess,
}: CarModalProps) {
  const supabase = createClient();
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // New Progress State
  const isEditing = !!car;

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
      year: currentYear,
      price: 0,
      image: "",
      images: "",
      type: "sedan",
      seats: 5,
      transmission: "automatic",
      fuel: "petrol",
      fuel_consumption: "",
      features: "",
      description: "",
      available: true,
    },
  });

  useEffect(() => {
    if (car) {
      reset({
        name: car.name,
        model: car.model,
        year: car.year,
        price: car.price,
        image: car.image ?? "",
        images: car.images?.join(", ") ?? "",
        type: car.type,
        seats: car.seats,
        transmission: car.transmission,
        fuel: car.fuel,
        fuel_consumption: car.fuel_consumption ?? "",
        features: car.features?.join(", ") ?? "",
        description: car.description ?? "",
        available: car.available,
      });
    } else {
      reset({
        name: "",
        model: "",
        year: currentYear,
        price: 0,
        image: "",
        images: "",
        type: "sedan",
        seats: 5,
        transmission: "automatic",
        fuel: "petrol",
        fuel_consumption: "",
        features: "",
        description: "",
        available: true,
      });
    }
    // Reset progress when modal opens/closes
    if (!open) setProgress(0);
  }, [car, reset, open]);

  const onSubmit = async (data: CarFormData) => {
    setIsLoading(true);
    setUploading(true);
    setProgress(5); // Initial start

    try {
      let coverUrl = car?.image ?? "";
      if (coverImageFile) {
        coverUrl = await uploadCarImage(coverImageFile);
        setProgress(30); // Cover uploaded
      } else {
        setProgress(20); // Skip cover
      }

      let galleryUrls: string[] = car?.images ?? [];
      if (galleryFiles.length > 0) {
        const stepSize = 50 / galleryFiles.length;
        const newGallery: string[] = [];

        for (let i = 0; i < galleryFiles.length; i++) {
          const url = await uploadCarImage(galleryFiles[i]);
          newGallery.push(url);
          setProgress((prev) => prev + stepSize);
        }
        galleryUrls = [...galleryUrls, ...newGallery];
      } else {
        setProgress(70); // Skip gallery
      }

      const payload = {
        name: data.name,
        model: data.model,
        year: Number(data.year),
        price: Number(data.price),
        image: coverUrl || null,
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
      };

      let error;
      if (isEditing) {
        ({ error } = await supabase
          .from("cars")
          .update(payload)
          .eq("id", car!.id));
      } else {
        ({ error } = await supabase.from("cars").insert(payload));
      }

      if (error) throw error;

      setProgress(100); // Database complete
      toast.success(isEditing ? "Car updated!" : "Car added!");

      setTimeout(() => {
        setCoverImageFile(null);
        setGalleryFiles([]);
        onOpenChange(false);
        onSuccess?.();
      }, 400);
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
      setProgress(0);
    } finally {
      setIsLoading(false);
      setUploading(false);
    }
  };

  const SectionHeader = ({
    icon: Icon,
    title,
  }: {
    icon: any;
    title: string;
  }) => (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 mb-4 mt-6 first:mt-0">
      <Icon className="w-4 h-4 text-accent" />
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={isLoading ? () => {} : onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-none rounded-3xl sm:max-h-[85vh] flex flex-col h-full">
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Car className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {isEditing ? "Update Vehicle" : "New Listing"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {isEditing
                  ? `Editing ${car?.name} ${car?.model}`
                  : "Add a premium car to your fleet"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <form
            id="car-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-1"
          >
            <SectionHeader icon={Settings2} title="Basic Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold px-1">
                  Brand Name
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Mercedes"
                  className="rounded-xl bg-slate-50 border-none h-11"
                  {...register("name", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model" className="text-xs font-semibold px-1">
                  Model Variant
                </Label>
                <Input
                  required
                  id="model"
                  placeholder="e.g. C-Class"
                  className="rounded-xl bg-slate-50 border-none h-11"
                  {...register("model", { required: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold px-1">Year</Label>
                <Input
                  required
                  type="number"
                  className="rounded-xl bg-slate-50 border-none h-11"
                  {...register("year", { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold px-1">KES / Day</Label>
                <Input
                  required
                  type="number"
                  className="rounded-xl bg-slate-50 border-none h-11"
                  {...register("price", { required: true })}
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold px-1">Seats</Label>
                <Input
                  required
                  type="number"
                  className="rounded-xl bg-slate-50 border-none h-11"
                  {...register("seats", { required: true })}
                />
              </div>
            </div>

            <SectionHeader icon={Gauge} title="Technical Specs" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold px-1">Category</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(carTypeLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold px-1">Gearbox</Label>
                <Controller
                  name="transmission"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(transmissionLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold px-1">Fuel</Label>
                <Controller
                  name="fuel"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-none h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(fuelLabels).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <SectionHeader icon={ImageIcon} title="Media & Extras" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold px-1 flex items-center justify-between">
                  Main Photo
                  {coverImageFile && (
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">
                      Selected
                    </span>
                  )}
                </Label>
                <div className="relative group cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) =>
                      setCoverImageFile(e.target.files?.[0] ?? null)
                    }
                  />
                  <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1 group-hover:bg-slate-50 transition-colors">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Click to upload cover
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold px-1 flex items-center justify-between">
                  Gallery
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {galleryFiles.length} files
                  </span>
                </Label>
                <div className="relative group cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) =>
                      setGalleryFiles(Array.from(e.target.files ?? []))
                    }
                  />
                  <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1 group-hover:bg-slate-50 transition-colors">
                    <Plus className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Add more photos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mt-4">
              <Label className="text-xs font-semibold px-1">
                Key Features (comma separated)
              </Label>
              <Input
                required
                placeholder="Bluetooth, Sunroof, AC..."
                className="rounded-xl bg-slate-50 border-none h-11"
                {...register("features")}
              />
            </div>

            <div className="space-y-1.5 mt-4">
              <Label className="text-xs font-semibold px-1">Description</Label>
              <Textarea
                rows={3}
                placeholder="Vehicle highlights..."
                className="rounded-xl bg-slate-50 border-none resize-none"
                {...register("description")}
              />
            </div>

            <div className="flex items-center justify-between bg-accent/5 rounded-2xl p-4 mt-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isLoading ? "bg-slate-200" : "bg-white",
                  )}
                >
                  <Info className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold">Visibility</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                    Show to customers
                  </p>
                </div>
              </div>
              <Controller
                name="available"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </form>

          {/* Progress Section - Shows when loading */}
          {isLoading && (
            <div className="mt-8 space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>
                  {uploading ? "Uploading Media..." : "Finalizing Record..."}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress
                value={progress}
                className="h-2 bg-slate-200 dark:bg-slate-800"
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="py-4 mt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 rounded-xl h-12 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="car-form"
              disabled={isLoading}
              className="flex-[2] bg-accent hover:bg-accent/90 text-white rounded-xl h-12 font-bold shadow-lg shadow-accent/20"
            >
              {isLoading
                ? uploading
                  ? "Processing..."
                  : "Saving..."
                : isEditing
                  ? "Update Vehicle"
                  : "Create Listing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
