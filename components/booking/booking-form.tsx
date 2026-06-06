"use client";

import { useForm, Controller } from "react-hook-form";
import * as Select from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingFormProps {
  carName: string;
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
}

export interface BookingFormData {
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const LOCATIONS = [
  "JKIA", "Wilson Airport", "Kilimani", "Hurlingham", "Kileleshwa", 
  "Ngong", "Karen", "Kitisuru", "Runda", "Kawangware", "Kikuyu", 
  "Thika Town", "Juja", "Nairobi CBD", "Kitengela", "Sabaki", 
  "Syokimau", "Embakasi", "Athi River", "Lang'ata", "Uthiru", 
  "Ruaka", "Kiambu"
];

export function BookingForm({ onSubmit, isLoading = false }: BookingFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<BookingFormData>();

  const onSubmitForm = (data: BookingFormData) => {
    if (new Date(data.pickupDate) >= new Date(data.returnDate)) {
      toast.error("Return date must be after pickup date");
      return;
    }
    onSubmit(data);
  };

  const LocationSelect = ({ name, placeholder }: { name: "pickupLocation" | "returnLocation", placeholder: string }) => (
    <Controller
      name={name}
      control={control}
      rules={{ required: "This location is required" }}
      render={({ field }) => (
        <Select.Root onValueChange={field.onChange} value={field.value}>
          <Select.Trigger 
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent",
              errors[name] ? "border-destructive" : "border-input"
            )}
          >
            <Select.Value placeholder={placeholder} />
            <Select.Icon><ChevronDown className="h-4 w-4 opacity-50" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card text-foreground shadow-md animate-in fade-in-80">
              <Select.Viewport className="p-1 max-h-60 overflow-y-auto">
                {LOCATIONS.map((loc) => (
                  <Select.Item 
                    key={loc} 
                    value={loc} 
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent/10 focus:text-accent data-[state=checked]:text-accent"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Select.ItemIndicator><Check className="h-4 w-4" /></Select.ItemIndicator>
                    </span>
                    <Select.ItemText>{loc}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmitForm)}>
      <Card className="p-6 shadow-sm mb-6 bg-card border-none">
        <h3 className="font-semibold text-lg text-foreground mb-4">Rental Details</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupDate">Pickup Date</Label>
              <Input
                id="pickupDate"
                type="date"
                {...register("pickupDate", { required: "Pickup date is required" })}
                className={errors.pickupDate ? "border-destructive" : ""}
              />
              {errors.pickupDate && <p className="text-xs text-destructive">{errors.pickupDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">Return Date</Label>
              <Input
                id="returnDate"
                type="date"
                {...register("returnDate", { required: "Return date is required" })}
                className={errors.returnDate ? "border-destructive" : ""}
              />
              {errors.returnDate && <p className="text-xs text-destructive">{errors.returnDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <LocationSelect name="pickupLocation" placeholder="Select pickup location" />
              {errors.pickupLocation && <p className="text-xs text-destructive">{errors.pickupLocation.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Return Location</Label>
              <LocationSelect name="returnLocation" placeholder="Select return location" />
              {errors.returnLocation && <p className="text-xs text-destructive">{errors.returnLocation.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-sm mb-6 bg-card border-none">
        <h3 className="font-semibold text-lg text-foreground mb-4">Personal Information</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register("firstName", { required: "First name is required" })}
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register("lastName", { required: "Last name is required" })}
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" },
                })}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XX XXX XXX"
                {...register("phone", { required: "Phone number is required" })}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={isLoading}>
        {isLoading ? "Initiating STK Push..." : "Confirm & Pay via M-Pesa"}
      </Button>
    </form>
  );
}
