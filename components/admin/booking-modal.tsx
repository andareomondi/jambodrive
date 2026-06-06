"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Banknote, ChevronDown, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { adminCreateBooking } from "@/lib/actions/admin";

interface BookingFormData {
  car_id: string;
  profile_id: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  return_location: string;
  total_price: number;
  insurance: boolean;
}

interface AvailableCar  { id: string; name: string; model: string; price: number }
interface CustomerProfile { id: string; full_name: string | null; email: string | null }

export function BookingModal({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading]         = useState(false);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [profiles, setProfiles]           = useState<CustomerProfile[]>([]);

  const { register, handleSubmit, control, reset } = useForm<BookingFormData>({
    defaultValues: {
      insurance: false,
      profile_id: "none",
      pickup_location: "Main Office",
      return_location: "Main Office",
    },
  });

  // Fetch available cars + profiles when modal opens — browser client only
  useEffect(() => {
    if (!open) { reset(); return; }

    const supabase = createClient();
    Promise.all([
      supabase.from("cars").select("id, name, model, price").eq("available", true),
      supabase.from("profiles").select("id, full_name, email"),
    ]).then(([carsRes, profilesRes]) => {
      if (carsRes.data)    setAvailableCars(carsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    });
  }, [open, reset]);

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    try {
      await adminCreateBooking({
        ...data,
        profile_id: data.profile_id === "none" ? null : data.profile_id,
      });
      toast.success("Booking created and car marked as rented.");
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  // Shared Select styling
  const selectTriggerCls = "flex h-11 w-full items-center justify-between rounded-xl border border-input bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" /><span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-accent" />
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Create Manual Booking
            </Dialog.Title>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Car */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Vehicle</Label>
              <Controller name="car_id" control={control} rules={{ required: true }}
                render={({ field }) => (
                  <Select.Root onValueChange={field.onChange} value={field.value}>
                    <Select.Trigger className={selectTriggerCls}>
                      <Select.Value placeholder="Choose an available car" />
                      <Select.Icon><ChevronDown className="h-4 w-4 text-muted-foreground" /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                        <Select.Viewport className="p-1">
                          {availableCars.map((car) => (
                            <Select.Item key={car.id} value={car.id}
                              className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none">
                              <Select.ItemText>{car.name} {car.model} — Ksh {car.price.toLocaleString()}/day</Select.ItemText>
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
              <Label className="text-xs font-bold uppercase tracking-wider">Customer (Optional)</Label>
              <Controller name="profile_id" control={control}
                render={({ field }) => (
                  <Select.Root onValueChange={field.onChange} value={field.value ?? "none"}>
                    <Select.Trigger className={selectTriggerCls}>
                      <Select.Value placeholder="Walk-in or select customer" />
                      <Select.Icon><ChevronDown className="h-4 w-4 text-muted-foreground" /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                        <Select.Viewport className="p-1">
                          <Select.Item value="none"
                            className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none">
                            <Select.ItemText>Walk-in (No Account)</Select.ItemText>
                          </Select.Item>
                          {profiles.map((p) => (
                            <Select.Item key={p.id} value={p.id}
                              className="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent/10 focus:bg-accent/10 outline-none">
                              <Select.ItemText>{p.full_name} ({p.email})</Select.ItemText>
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
                { label: "Return Date", name: "return_date"  as const },
              ].map(({ label, name }) => (
                <div key={name} className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">{label}</Label>
                  <Input type="date" {...register(name, { required: true })}
                    className="rounded-xl bg-muted/40 border-border h-11" />
                </div>
              ))}
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Pickup Location", name: "pickup_location" as const },
                { label: "Return Location", name: "return_location" as const },
              ].map(({ label, name }) => (
                <div key={name} className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">{label}</Label>
                  <Input {...register(name)} className="rounded-xl bg-muted/40 border-border h-11" />
                </div>
              ))}
            </div>

            {/* Total price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Total Price (Ksh)</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" {...register("total_price", { required: true, valueAsNumber: true })}
                  className="pl-9 rounded-xl bg-muted/40 border-border h-11" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" disabled={isLoading}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isLoading}
                className="flex-[2] bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 font-bold">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirm Booking
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
