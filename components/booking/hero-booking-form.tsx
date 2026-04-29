"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface QuickBookingData {
  pickupLocation: string;
  dropOffLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropOffDate: string;
  dropOffTime: string;
  type: string;
}

interface HeroBookingFormProps {
  onSuccess?: (data: QuickBookingData) => void;
}

export function HeroBookingForm({ onSuccess }: HeroBookingFormProps) {
  const router = useRouter();
  const [useWhatsApp, setUseWhatsApp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickBookingData>({
    defaultValues: {
      type: "economy",
    },
  });

  const locations = [
    { id: "jkia", name: "JKIA" },
    { id: "athi_river", name: "Athi River" },
    { id: "nairobi_cbd", name: "Nairobi CBD" },
    { id: "mombasa", name: "Mombasa" },
  ];

  const types = [
    { id: "economy", name: "Economy" },
    { id: "compact", name: "Compact" },
    { id: "executive", name: "Executive" },
    { id: "suv", name: "SUV" },
    { id: "ssuv", name: "Luxury SUV" },
    { id: "vans", name: "Vans" },
    { id: "safari", name: "Safari" },
    { id: "wedding", name: "Wedding & Events" },
  ];

  const generateWhatsAppMessage = (data: QuickBookingData) => {
    const message = `Hi! I'd like to book a car:\n\nType: ${data.type}\nPickup: ${data.pickupLocation} on ${data.pickupDate} at ${data.pickupTime}\nDrop-off: ${data.dropOffLocation} on ${data.dropOffDate} at ${data.dropOffTime}`;
    return encodeURIComponent(message);
  };

  const onSubmit = (data: QuickBookingData) => {
    if (!data.pickupDate || !data.dropOffDate) {
      toast.error("Please select both dates");
      return;
    }

    const pickup = new Date(`${data.pickupDate}T${data.pickupTime || "00:00"}`);
    const dropoff = new Date(
      `${data.dropOffDate}T${data.dropOffTime || "00:00"}`,
    );

    if (pickup >= dropoff) {
      toast.error("Drop-off date/time must be after pickup");
      return;
    }

    if (useWhatsApp) {
      const whatsappNumber = "254758500943";
      const message = generateWhatsAppMessage(data);
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappURL, "_blank");
      toast.success("Opening WhatsApp...");
      setUseWhatsApp(false);
    } else {
      const queryParams = new URLSearchParams({
        pickup_loc: data.pickupLocation,
        dropoff_loc: data.dropOffLocation,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        dropoff_date: data.dropOffDate,
        dropoff_time: data.dropOffTime,
        type: data.type,
      }).toString();

      if (onSuccess) onSuccess(data);
      router.push(`/cars?${queryParams}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-7xl mx-auto w-full"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-white/20 dark:border-slate-800/50">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5 items-end">
          {/* Pickup Location (Native Type-or-Select) */}
          <div className="group">
            <Label
              htmlFor="pickupLocation"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Pickup Location
            </Label>
            <Input
              id="pickupLocation"
              list="pickup-locations"
              placeholder="Select or type..."
              {...register("pickupLocation", { required: true })}
              className={`text-sm px-3 py-2.5 rounded-md ${errors.pickupLocation ? "border-red-500" : ""}`}
            />
            <datalist id="pickup-locations">
              {locations.map((loc) => (
                <option key={`pickup-${loc.id}`} value={loc.name} />
              ))}
            </datalist>
          </div>

          {/* Drop Off Location (Native Type-or-Select) */}
          <div className="group">
            <Label
              htmlFor="dropOffLocation"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Drop Off Location
            </Label>
            <Input
              id="dropOffLocation"
              list="dropoff-locations"
              placeholder="Select or type..."
              {...register("dropOffLocation", { required: true })}
              className={`text-sm px-3 py-2.5 rounded-md ${errors.dropOffLocation ? "border-red-500" : ""}`}
            />
            <datalist id="dropoff-locations">
              {locations.map((loc) => (
                <option key={`drop-${loc.id}`} value={loc.name} />
              ))}
            </datalist>
          </div>

          {/* Dates & Times */}
          <div className="group">
            <Label
              htmlFor="pickupDate"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              type="date"
              {...register("pickupDate", { required: true })}
              className={`text-sm px-3 py-2.5 rounded-md ${errors.pickupDate ? "border-red-500" : ""}`}
            />
          </div>

          <div className="group">
            <Label
              htmlFor="pickupTime"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Pickup Time
            </Label>
            <Input
              required
              id="pickupTime"
              type="time"
              {...register("pickupTime")}
              className="text-sm px-3 py-2.5 rounded-md"
            />
          </div>

          <div className="group">
            <Label
              htmlFor="dropOffDate"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Drop Off Date
            </Label>
            <Input
              id="dropOffDate"
              type="date"
              {...register("dropOffDate", { required: true })}
              className={`text-sm px-3 py-2.5 rounded-md ${errors.dropOffDate ? "border-red-500" : ""}`}
            />
          </div>

          <div className="group">
            <Label
              htmlFor="dropOffTime"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Drop Off Time
            </Label>
            <Input
              required
              id="dropOffTime"
              type="time"
              {...register("dropOffTime")}
              className="text-sm px-3 py-2.5 rounded-md"
            />
          </div>

          {/* Type */}
          <div className="group">
            <Label
              htmlFor="type"
              className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block"
            >
              Category
            </Label>
            <select
              id="type"
              {...register("type")}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
            >
              {types.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="group">
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold uppercase text-sm rounded-md h-[42px]"
              onClick={() => setUseWhatsApp(false)}
            >
              Search
            </Button>
          </div>
        </div>

        {/* WhatsApp Section */}
        <div className="flex flex-col items-center pt-3 border-t border-gray-200 dark:border-slate-700/50 mt-2">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-[#3bdf70] hover:bg-green-50 hover:text-green font-bold text-xs uppercase transition-all"
            onClick={() => setUseWhatsApp(true)}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            WhatsApp Me
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1 ">
            Details will be sent to the admin and he will reach out to you.
          </p>
        </div>
      </div>
    </form>
  );
}
