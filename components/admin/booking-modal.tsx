"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Banknote, 
  ChevronDown, 
  Loader2, 
  X, 
  Phone,
  Smartphone,
  Wifi,
  CheckCircle,
  XCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Booking } from "@/types"; // Make sure to import Booking type

interface BookingFormData {
  car_id: string;
  profile_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_price: number;
  insurance: boolean;
  mpesa_phone: string;
}

interface AvailableCar {
  id: string;
  name: string;
  model: string;
  price: number;
}

interface CustomerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

type PaymentState = "idle" | "processing" | "waiting_for_pin" | "success" | "failed";

export function BookingModal({
  open,
  onOpenChange,
  onSuccess,
  booking, // Accept an optional pending booking
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  booking?: Booking | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  
  // STK Push State
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<BookingFormData>({
    defaultValues: {
      insurance: false,
      profile_id: "none",
      pickup_location: "Main Office",
      return_location: "Main Office",
      mpesa_phone: "",
      total_price: 0,
    },
  });

  // Watch fields for auto-calculation
  const selectedCarId = watch("car_id");
  const pickupDate = watch("pickup_date");
  const returnDate = watch("return_date");

  useEffect(() => {
    if (!open) {
      reset({
        car_id: "",
        profile_id: "none",
        pickup_date: "",
        return_date: "",
        pickup_location: "Main Office",
        return_location: "Main Office",
        mpesa_phone: "",
        total_price: 0,
        insurance: false,
      });
      setPaymentState("idle");
      channelRef.current?.unsubscribe();
      return;
    }

    // Prefill form if a pending booking is provided[cite: 3]
    if (booking) {
      reset({
        car_id: booking.car_id ?? "",
        profile_id: booking.profile_id ?? "none",
        // Extract YYYY-MM-DD from ISO strings for native date inputs
        pickup_date: booking.pickup_date.split("T")[0],
        return_date: booking.return_date.split("T")[0],
        pickup_location: booking.pickup_location,
        return_location: booking.return_location,
        total_price: booking.total_price,
        insurance: booking.insurance ?? false,
        // Fallback to profile phone if booking mpesa_phone is empty
        mpesa_phone: booking.mpesa_phone || booking.profiles?.phone || "",
      });
    }

    const supabase = createClient();
    Promise.all([
      // Only require availability if it's a new booking; if editing an existing booking, the car might already be marked unavailable
      supabase
        .from("cars")
        .select("id, name, model, price")
        .or(`available.eq.true${booking ? `,id.eq.${booking.car_id}` : ''}`),
      supabase.from("profiles").select("id, full_name, email"),
    ]).then(([carsRes, profilesRes]) => {
      if (carsRes.data) setAvailableCars(carsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    });
  }, [open, reset, booking]);

  // Cleanup channel on unmount[cite: 3]
  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  // Auto-calculate Total Price[cite: 3]
  useEffect(() => {
    if (selectedCarId && pickupDate && returnDate) {
      const pDate = new Date(pickupDate);
      const rDate = new Date(returnDate);
      
      if (rDate >= pDate) {
        const ms = rDate.getTime() - pDate.getTime();
        const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
        const car = availableCars.find((c) => c.id === selectedCarId);
        
        if (car) {
          setValue("total_price", days * car.price, { shouldValidate: true });
        }
      }
    }
  }, [selectedCarId, pickupDate, returnDate, availableCars, setValue]);

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    setPaymentState("processing");

    try {
      const supabase = createClient();
      
      const ms = new Date(data.return_date).getTime() - new Date(data.pickup_date).getTime();
      const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));

      let targetBookingId = booking?.id;

      // 1. Update existing pending booking or insert a new one
      if (targetBookingId) {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({
            car_id: data.car_id,
            profile_id: data.profile_id === "none" ? null : data.profile_id,
            pickup_date: new Date(data.pickup_date).toISOString(),
            return_date: new Date(data.return_date).toISOString(),
            pickup_location: data.pickup_location,
            return_location: data.return_location,
            total_price: data.total_price,
            mpesa_phone: data.mpesa_phone,
            days,
            insurance: data.insurance,
          })
          .eq("id", targetBookingId);

        if (updateError) {
          throw new Error(updateError.message ?? "Failed to update pending booking.");
        }
      } else {
        const { data: newBooking, error: bookingError } = await supabase
          .from("bookings")
          .insert({
            car_id: data.car_id,
            profile_id: data.profile_id === "none" ? null : data.profile_id,
            pickup_date: new Date(data.pickup_date).toISOString(),
            return_date: new Date(data.return_date).toISOString(),
            pickup_location: data.pickup_location,
            return_location: data.return_location,
            total_price: data.total_price,
            status: "pending",
            mpesa_phone: data.mpesa_phone,
            days,
            insurance: data.insurance,
          })
          .select()
          .single();

        if (bookingError || !newBooking) {
          throw new Error(bookingError?.message ?? "Failed to create pending booking.");
        }
        targetBookingId = newBooking.id;
      }

      // 2. Listen for Daraja webhook success[cite: 3]
      const channel = supabase
        .channel(`admin_booking_status_${targetBookingId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bookings",
            filter: `id=eq.${targetBookingId}`,
          },
          async (payload) => {
            const updated = payload.new as any;
            if (updated.status === "confirmed") {
              await supabase.from("cars").update({ available: false }).eq("id", data.car_id);
              
              setPaymentState("success");
              toast.success("STK Payment confirmed!");
              channel.unsubscribe();
              
              // Auto-close modal after brief success celebration
              setTimeout(() => {
                onSuccess();
                onOpenChange(false);
              }, 2500);

            } else if (updated.status === "failed") {
              setPaymentState("failed");
              toast.error(updated.payment_failure_reason ?? "Payment was cancelled or failed.");
              channel.unsubscribe();
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      // 3. Initiate the STK Push[cite: 3]
      const stkResponse = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.mpesa_phone,
          amount: data.total_price,
          bookingId: targetBookingId,
        }),
      });

      const stkData = await stkResponse.json();

      if (!stkResponse.ok || !stkData.success) {
        channel.unsubscribe();
        await supabase
          .from("bookings")
          .update({ status: "failed", payment_failure_reason: stkData.error })
          .eq("id", targetBookingId);
        throw new Error(stkData.error ?? "M-Pesa request failed.");
      }

      setPaymentState("waiting_for_pin");

      // 4. Fallback timeout logic[cite: 3]
      setTimeout(() => {
        setPaymentState((current) => {
          if (current === "waiting_for_pin") {
            channel.unsubscribe();
            toast.error("The payment prompt timed out.");
            return "failed";
          }
          return current;
        });
      }, 90_000);

    } catch (err: unknown) {
      console.error("Admin STK Error:", err);
      setPaymentState("failed");
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectTriggerCls =
    "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* ── STK Push Processing Views ── */}
          {paymentState !== "idle" ? (
             <div className="py-8">
               {/* ... Processing views remain untouched ... */}
               {paymentState === "processing" && (
                 <div className="flex flex-col items-center text-center gap-4">
                   <Loader2 className="w-12 h-12 text-[#25D366] animate-spin" />
                   <div>
                     <h2 className="text-xl font-bold text-foreground mb-1">Initiating STK Push</h2>
                     <p className="text-sm text-muted-foreground">Connecting to Safaricom...</p>
                   </div>
                 </div>
               )}
 
               {paymentState === "waiting_for_pin" && (
                 <div className="flex flex-col items-center text-center gap-5 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-[#25D366] animate-pulse" />
                   <div className="relative">
                     <div className="absolute inset-0 bg-[#25D366]/20 rounded-full animate-ping" />
                     <div className="relative w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center shadow-inner">
                       <Smartphone className="w-9 h-9 text-[#25D366]" />
                       <Wifi className="w-4 h-4 text-[#25D366] absolute -top-1 -right-1 animate-pulse" />
                     </div>
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-foreground mb-2">Awaiting PIN</h2>
                     <p className="text-sm text-muted-foreground">
                       Prompt sent to the customer's phone. Waiting for them to enter their M-Pesa PIN.
                     </p>
                   </div>
                   <div className="bg-muted rounded-xl px-4 py-3 w-full flex items-center justify-center gap-3">
                     <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                     <span className="text-sm text-muted-foreground">Listening for payment callback...</span>
                   </div>
                 </div>
               )}
 
               {paymentState === "success" && (
                 <div className="flex flex-col items-center text-center gap-4">
                   <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                     <CheckCircle className="w-10 h-10 text-[#25D366]" />
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold text-foreground mb-1">Payment Received!</h2>
                     <p className="text-sm text-muted-foreground">Booking has been secured.</p>
                   </div>
                 </div>
               )}
 
               {paymentState === "failed" && (
                 <div className="flex flex-col items-center text-center gap-5">
                   <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                     <XCircle className="w-8 h-8 text-destructive" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold text-foreground mb-2">Payment Failed</h2>
                     <p className="text-sm text-muted-foreground">The transaction was cancelled or timed out.</p>
                   </div>
                   <Button
                     onClick={() => setPaymentState("idle")}
                     className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                   >
                     Try Again
                   </Button>
                 </div>
               )}
             </div>
          ) : (
            <>
              {/* ── Standard Booking Form ── */}
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-accent" />
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  {booking ? "Process Pending Booking" : "Create M-Pesa Booking"}
                </Dialog.Title>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* ... Form inputs remain unchanged ... */}
                {/* Car */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Vehicle
                  </Label>
                  <Controller
                    name="car_id"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select.Root
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <Select.Trigger className={selectTriggerCls}>
                          <Select.Value placeholder="Choose an available car" />
                          <Select.Icon>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                            <Select.Viewport className="p-1">
                              {availableCars.map((car) => (
                                <Select.Item
                                  key={car.id}
                                  value={car.id}
                                  className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none"
                                >
                                  <Select.ItemText>
                                    {car.name} {car.model} — Ksh{" "}
                                    {car.price.toLocaleString()}/day
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    )}
                  />
                </div>

                {/* Customer */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Customer
                  </Label>
                  <Controller
                    name="profile_id"
                    control={control}
                    render={({ field }) => (
                      <Select.Root
                        onValueChange={field.onChange}
                        value={field.value ?? "none"}
                      >
                        <Select.Trigger className={selectTriggerCls}>
                          <Select.Value placeholder="Walk-in or select customer" />
                          <Select.Icon>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                            <Select.Viewport className="p-1 max-h-[200px] overflow-y-auto">
                              <Select.Item
                                value="none"
                                className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none"
                              >
                                <Select.ItemText>
                                  Walk-in (No Account)
                                </Select.ItemText>
                              </Select.Item>
                              {profiles.map((p) => (
                                <Select.Item
                                  key={p.id}
                                  value={p.id}
                                  className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none"
                                >
                                  <Select.ItemText>
                                    {p.full_name} ({p.email})
                                  </Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    )}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Pickup Date", name: "pickup_date" as const },
                    { label: "Return Date", name: "return_date" as const },
                  ].map(({ label, name }) => (
                    <div key={name} className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">{label}</Label>
                      <Input
                        type="date"
                        {...register(name, { required: true })}
                        className="rounded-xl bg-muted/40 border-border h-11"
                      />
                    </div>
                  ))}
                </div>

                {/* Locations */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Pickup Loc", name: "pickup_location" as const },
                    { label: "Return Loc", name: "return_location" as const },
                  ].map(({ label, name }) => (
                    <div key={name} className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">{label}</Label>
                      <Input
                        {...register(name)}
                        className="rounded-xl bg-muted/40 border-border h-11"
                      />
                    </div>
                  ))}
                </div>

                {/* Pricing & M-Pesa Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total price (Auto-calculated) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      Auto-Total (Ksh)
                    </Label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                      <Input
                        type="number"
                        readOnly
                        {...register("total_price", {
                          required: true,
                          valueAsNumber: true,
                        })}
                        className="pl-9 rounded-xl bg-muted/20 border-border h-11 cursor-not-allowed opacity-80 font-bold"
                      />
                    </div>
                  </div>

                  {/* M-Pesa Phone (Required) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      M-Pesa Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="07XX XXX XXX"
                        {...register("mpesa_phone", { required: true })}
                        className="pl-9 rounded-xl bg-muted/40 border-border h-11 focus:ring-2 focus:ring-[#25D366]/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
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
                    disabled={isLoading || !watch("total_price") || !watch("mpesa_phone")}
                    className="flex-[2] bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl h-11 font-bold transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
                    Confirm & Send STK Push
                  </Button>
                </div>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
