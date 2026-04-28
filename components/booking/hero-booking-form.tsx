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
  const [pickupLocation, setPickupLocation] = useState("JKIA");
  const [dropOffLocation, setDropOffLocation] = useState("Athi River");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickBookingData>({
    defaultValues: {
      type: "sedan",
    },
  });

  const locations = [
    { id: "jkia", name: "JKIA" },
    { id: "athi_river", name: "Athi River" },
    { id: "nairobi_cbd", name: "Nairobi CBD" },
    { id: "mombasa", name: "Mombasa" },
  ];

  const types = [
    { id: "sedan", name: "Sedan" },
    { id: "suv", name: "SUV" },
    { id: "coupe", name: "Coupe" },
    { id: "hatchback", name: "Hatchback" },
    { id: "truck", name: "Truck" },
  ];

  const generateWhatsAppMessage = (data: QuickBookingData) => {
    const message = `Hi! I'd like to book a car:\n\nType: ${data.type}\nPickup: ${pickupLocation} on ${data.pickupDate} at ${data.pickupTime}\nDrop-off: ${dropOffLocation} on ${data.dropOffDate} at ${data.dropOffTime}`;
    return encodeURIComponent(message);
  };

  const onSubmit = (data: QuickBookingData) => {
    if (!data.pickupDate || !data.dropOffDate) {
      toast.error("Please select both dates");
      return;
    }

    if (!pickupLocation || !dropOffLocation) {
      toast.error("Please enter both pickup and drop-off locations");
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

    const finalData = { ...data, pickupLocation, dropOffLocation };

    if (useWhatsApp) {
      const whatsappNumber = "254758500943";
      const message = generateWhatsAppMessage(data);
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
      toast.success("Opening WhatsApp...");
      setUseWhatsApp(false);
    } else {
      const queryParams = new URLSearchParams({
        pickup_loc: finalData.pickupLocation,
        dropoff_loc: finalData.dropOffLocation,
        pickup_date: finalData.pickupDate,
        pickup_time: finalData.pickupTime,
        dropoff_date: finalData.dropOffDate,
        dropoff_time: finalData.dropOffTime,
        type: finalData.type,
      }).toString();
      router.push(`/cars?${queryParams}`);
    }
  };

  const inputClass =
    "w-full text-sm px-3 py-2.5 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500";
  const labelClass =
    "text-[10px] font-bold text-foreground/80 uppercase tracking-widest mb-1.5 block";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-7xl mx-auto w-full"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-white/20 dark:border-slate-800/50">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-5 items-end">
          {/* Pickup Location */}
          <div className="group">
            <Label htmlFor="pickupLocation" className={labelClass}>
              Pickup Location
            </Label>
            <input
              id="pickupLocation"
              list="pickup-locations"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Select or type..."
              className={inputClass}
            />
            <datalist id="pickup-locations">
              {locations.map((loc) => (
                <option key={`pickup-${loc.id}`} value={loc.name} />
              ))}
            </datalist>
          </div>

          {/* Drop Off Location */}
          <div className="group">
            <Label htmlFor="dropOffLocation" className={labelClass}>
              Drop Off Location
            </Label>
            <input
              id="dropOffLocation"
              list="dropoff-locations"
              value={dropOffLocation}
              onChange={(e) => setDropOffLocation(e.target.value)}
              placeholder="Select or type..."
              className={inputClass}
            />
            <datalist id="dropoff-locations">
              {locations.map((loc) => (
                <option key={`drop-${loc.id}`} value={loc.name} />
              ))}
            </datalist>
          </div>

          {/* Pickup Date */}
          <div className="group">
            <Label htmlFor="pickupDate" className={labelClass}>
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              type="date"
              {...register("pickupDate", { required: true })}
              className={`text-sm px-3 py-2.5 rounded-md ${errors.pickupDate ? "border-red-500" : ""}`}
            />
          </div>

          {/* Pickup Time */}
          <div className="group">
            <Label htmlFor="pickupTime" className={labelClass}>
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

          {/* Drop Off Date */}
          <div className="group">
            <Label htmlFor="dropOffDate" className={labelClass}>
              Drop Off Date
            </Label>
            <Input
              id="dropOffDate"
              type="date"
              {...register("dropOffDate", { required: true })}
              className={`text-sm px-3 py-2.5 rounded-md ${errors.dropOffDate ? "border-red-500" : ""}`}
            />
          </div>

          {/* Drop Off Time */}
          <div className="group">
            <Label htmlFor="dropOffTime" className={labelClass}>
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
            <Label htmlFor="type" className={labelClass}>
              Type
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

          {/* Search Button */}
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
          <p className="text-[10px] text-muted-foreground mt-1">
            Details will be sent to the admin and he will reach out to you.
          </p>
        </div>
      </div>
    </form>
  );
}
