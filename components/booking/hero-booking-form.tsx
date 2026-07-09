"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const LOCATIONS = [
  { id: "jkia",          name: "JKIA"          },
  { id: "wilson_airport",name: "Wilson Airport" },
  { id: "kilimani",      name: "Kilimani"       },
  { id: "hurlingham",    name: "Hurlingham"     },
  { id: "kileleshwa",    name: "Kileleshwa"     },
  { id: "ngong",         name: "Ngong"          },
  { id: "karen",         name: "Karen"          },
  { id: "kitisuru",      name: "Kitisuru"       },
  { id: "runda",         name: "Runda"          },
  { id: "kawangware",    name: "Kawangware"     },
  { id: "kikuyu",        name: "Kikuyu"         },
  { id: "thika_town",    name: "Thika Town"     },
  { id: "juja",          name: "Juja"           },
  { id: "nairobi_cbd",   name: "Nairobi CBD"    },
  { id: "kitengela",     name: "Kitengela"      },
  { id: "sabaki",        name: "Sabaki"         },
  { id: "syokimau",      name: "Syokimau"       },
  { id: "embakasi",      name: "Embakasi"       },
  { id: "athi_river",    name: "Athi River"     },
  { id: "langata",       name: "Lang'ata"       },
  { id: "uthiru",        name: "Uthiru"         },
  { id: "ruaka",         name: "Ruaka"          },
  { id: "kiambu",        name: "Kiambu"         },
] as const;

const CAR_TYPES = [
  { id: "economy",  name: "Economy"         },
  { id: "compact",  name: "Compact"         },
  { id: "executive",name: "Executive"       },
  { id: "suv",      name: "SUV"             },
  { id: "ssuv",     name: "Luxury SUV"      },
  { id: "vans",     name: "Vans"            },
  { id: "safari",   name: "Safari"          },
  { id: "wedding",  name: "Wedding & Events"},
] as const;

const WHATSAPP_NUMBER = "254758500943";

// ── Shared input className ────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `text-sm px-3 py-2.5 rounded-md bg-background border focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-all ${
    hasError
      ? "border-destructive focus:ring-destructive"
      : "border-border"
  }`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuickBookingData {
  pickupLocation:  string;
  dropOffLocation: string;
  pickupDate:      string;
  pickupTime:      string;
  dropOffDate:     string;
  dropOffTime:     string;
  type:            string;
}

interface HeroBookingFormProps {
  onSuccess?: (data: QuickBookingData) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroBookingForm({ onSuccess }: HeroBookingFormProps) {
  const router = useRouter();
  const [useWhatsApp, setUseWhatsApp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuickBookingData>({
    defaultValues: { type: "economy", pickupDate: "", dropOffDate: "" },
  });

  // Set default dates client-side to avoid hydration mismatch
  useEffect(() => {
    const today    = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];
    reset({ type: "economy", pickupDate: today, dropOffDate: tomorrow });
  }, [reset]);

  const buildWhatsAppMessage = (data: QuickBookingData) => {
    const msg = [
      "Hi! I'd like to book a car:",
      "",
      `Type: ${data.type}`,
      `Pickup: ${data.pickupLocation} on ${data.pickupDate} at ${data.pickupTime}`,
      `Drop-off: ${data.dropOffLocation} on ${data.dropOffDate} at ${data.dropOffTime}`,
    ].join("\n");
    return encodeURIComponent(msg);
  };

  const onSubmit = (data: QuickBookingData) => {
    const today = new Date().toISOString().split("T")[0];

    if (data.pickupDate < today) {
      toast.error("Pickup date cannot be in the past");
      return;
    }
    if (data.dropOffDate < today) {
      toast.error("Drop-off date cannot be in the past");
      return;
    }

    const pickup  = new Date(`${data.pickupDate}T${data.pickupTime  || "00:00"}`);
    const dropoff = new Date(`${data.dropOffDate}T${data.dropOffTime || "00:00"}`);

    if (pickup >= dropoff) {
      toast.error("Drop-off must be after pickup");
      return;
    }

    if (useWhatsApp) {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(data)}`;
      window.open(url, "_blank");
      toast.success("Opening WhatsApp...");
      setUseWhatsApp(false);
      return;
    }

    const params = new URLSearchParams({
      from:          data.pickupDate,
      pickup_time:   data.pickupTime,
      to:            data.dropOffDate,
      dropoff_time:  data.dropOffTime,
      type:          data.type,
    }).toString();

    onSuccess?.(data);
    router.push(`/cars?${params}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="bg-card/75 backdrop-blur-md rounded-xl shadow-2xl p-6 border border-border">

        <div className="grid grid-cols-2 gap-3 mb-5">

          {/* Pickup location */}
          <div>
            <Label htmlFor="pickupLocation" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Pickup Location
            </Label>
            <Input
              id="pickupLocation"
              list="pickup-locations"
              placeholder="Select or type..."
              {...register("pickupLocation", { required: true })}
              className={inputCls(!!errors.pickupLocation)}
            />
            <datalist id="pickup-locations">
              {LOCATIONS.map((loc) => (
                <option key={`p-${loc.id}`} value={loc.name} />
              ))}
            </datalist>
          </div>

          {/* Drop-off location */}
          <div>
            <Label htmlFor="dropOffLocation" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Drop Off Location
            </Label>
            <Input
              id="dropOffLocation"
              list="dropoff-locations"
              placeholder="Select or type..."
              {...register("dropOffLocation", { required: true })}
              className={inputCls(!!errors.dropOffLocation)}
            />
            <datalist id="dropoff-locations">
              {LOCATIONS.map((loc) => (
                <option key={`d-${loc.id}`} value={loc.name} />
              ))}
            </datalist>
          </div>

          {/* Pickup date */}
          <div>
            <Label htmlFor="pickupDate" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              type="date"
              {...register("pickupDate", { required: true })}
              className={inputCls(!!errors.pickupDate)}
            />
          </div>

          {/* Pickup time */}
          <div>
            <Label htmlFor="pickupTime" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Pickup Time
            </Label>
            <Input
              id="pickupTime"
              type="time"
              required
              {...register("pickupTime")}
              className={inputCls()}
            />
          </div>

          {/* Drop-off date */}
          <div>
            <Label htmlFor="dropOffDate" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Drop Off Date
            </Label>
            <Input
              id="dropOffDate"
              type="date"
              {...register("dropOffDate", { required: true })}
              className={inputCls(!!errors.dropOffDate)}
            />
          </div>

          {/* Drop-off time */}
          <div>
            <Label htmlFor="dropOffTime" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Drop Off Time
            </Label>
            <Input
              id="dropOffTime"
              type="time"
              required
              {...register("dropOffTime")}
              className={inputCls()}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="type" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Category
            </Label>
            <select
              id="type"
              {...register("type")}
              className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-all"
            >
              {CAR_TYPES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase text-sm rounded-md h-[42px]"
              onClick={() => setUseWhatsApp(false)}
            >
              Search
            </Button>
          </div>
        </div>

        {/* WhatsApp alternative */}
        <div className="flex flex-col items-center pt-3 border-t border-border gap-1">
          <Button
  type="submit"
  size="sm"
  className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase transition-all border-none"
  onClick={() => setUseWhatsApp(true)}
>
  <MessageCircle className="w-4 h-4 mr-1.5" />
  WhatsApp Me
</Button>          <p className="text-[10px] text-muted-foreground">
            Details will be sent to the admin and he will reach out to you.
          </p>
        </div>
      </div>
    </form>
  );
}
