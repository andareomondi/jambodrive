"use client";

import { useForm, Controller, useWatch } from "react-hook-form";
import * as Select from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RENTAL_LOCATION_GROUPS } from "@/lib/constants/locations";

interface BookingFormProps {
  carName: string;
  dailyRate: number;
  showPriceEstimate?: boolean;
  loadingLabel?: string;
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
  initialValues?: Partial<BookingFormData>;
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

export function BookingForm({
  carName,
  dailyRate,
  showPriceEstimate = true,
  loadingLabel = "Preparing secure payment…",
  onSubmit,
  isLoading = false,
  initialValues,
}: BookingFormProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: initialValues,
  });
  const [pickupDate, returnDate] = useWatch({
    control,
    name: ["pickupDate", "returnDate"],
  });
  const today = new Date();
  const todayLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const pickupTime = pickupDate
    ? Date.parse(`${pickupDate}T12:00:00Z`)
    : Number.NaN;
  const returnTime = returnDate
    ? Date.parse(`${returnDate}T12:00:00Z`)
    : Number.NaN;
  const estimateDays =
    Number.isFinite(pickupTime) &&
    Number.isFinite(returnTime) &&
    returnTime > pickupTime
      ? Math.round((returnTime - pickupTime) / 86_400_000)
      : 0;
  const estimatedTotal = estimateDays * dailyRate;

  const onSubmitForm = (data: BookingFormData) => {
    if (data.returnDate <= data.pickupDate) {
      toast.error("Return date must be after pickup date");
      return;
    }
    onSubmit(data);
  };

  const LocationSelect = ({
    name,
    placeholder,
    id,
  }: {
    name: "pickupLocation" | "returnLocation";
    placeholder: string;
    id: string;
  }) => (
    <Controller
      name={name}
      control={control}
      rules={{ required: "This location is required" }}
      render={({ field }) => (
        <Select.Root onValueChange={field.onChange} value={field.value}>
          <Select.Trigger
            id={id}
            ref={field.ref}
            onBlur={field.onBlur}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${id}-error` : undefined}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent",
              errors[name] ? "border-destructive" : "border-input",
            )}
          >
            <Select.Value placeholder={placeholder} />
            <Select.Icon>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              position="popper"
              side="bottom"
              align="start"
              sideOffset={4}
              className="z-50 w-[var(--radix-select-trigger-width)] max-h-[var(--radix-select-content-available-height)] overflow-hidden rounded-md border border-border bg-card text-foreground shadow-md animate-in fade-in-80"
            >
              <Select.Viewport className="max-h-[min(60vh,var(--radix-select-content-available-height))] overflow-y-auto p-1">
                {RENTAL_LOCATION_GROUPS.map((group) => (
                  <Select.Group key={group.county}>
                    <Select.Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.county}
                    </Select.Label>
                    {group.locations.map((location) => (
                      <Select.Item
                        key={location.id}
                        value={location.name}
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent/10 focus:text-accent data-[state=checked]:text-accent"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <Select.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </Select.ItemIndicator>
                        </span>
                        <Select.ItemText>{location.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} aria-busy={isLoading}>
      <Card className="mb-6 flex flex-col gap-3 border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Selected vehicle
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground">{carName}</h2>
          {showPriceEstimate && (
            <p className="text-sm text-muted-foreground">
              KSh {dailyRate.toLocaleString("en-KE")} per day
            </p>
          )}
        </div>
        {showPriceEstimate && (
          <div className="sm:text-right" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estimated rental total
          </p>
          <p className="mt-1 text-2xl font-bold text-accent">
            {estimateDays > 0
              ? `KSh ${estimatedTotal.toLocaleString("en-KE")}`
              : "Select your dates"}
          </p>
          {estimateDays > 0 && (
            <p className="text-xs text-muted-foreground">
              {estimateDays} {estimateDays === 1 ? "day" : "days"} · excludes
              optional extras
            </p>
          )}
          </div>
        )}
      </Card>
      <Card className="p-6 shadow-sm mb-6 bg-card border-none">
        <h3 className="font-semibold text-lg text-foreground mb-4">
          Rental Details
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupDate">Pickup Date</Label>
              <Input
                id="pickupDate"
                type="date"
                min={todayLocal}
                {...register("pickupDate", {
                  required: "Pickup date is required",
                  min: {
                    value: todayLocal,
                    message: "Pickup date cannot be in the past",
                  },
                })}
                aria-invalid={Boolean(errors.pickupDate)}
                aria-describedby={errors.pickupDate ? "pickupDate-error" : undefined}
                className={errors.pickupDate ? "border-destructive" : ""}
              />
              {errors.pickupDate && (
                <p id="pickupDate-error" role="alert" className="text-xs text-destructive">
                  {errors.pickupDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">Return Date</Label>
              <Input
                id="returnDate"
                type="date"
                min={pickupDate || todayLocal}
                {...register("returnDate", {
                  required: "Return date is required",
                  validate: (value) =>
                    !getValues("pickupDate") ||
                    value > getValues("pickupDate") ||
                    "Return date must be after pickup date",
                })}
                aria-invalid={Boolean(errors.returnDate)}
                aria-describedby={errors.returnDate ? "returnDate-error" : undefined}
                className={errors.returnDate ? "border-destructive" : ""}
              />
              {errors.returnDate && (
                <p id="returnDate-error" role="alert" className="text-xs text-destructive">
                  {errors.returnDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Pickup Location</Label>
              <LocationSelect
                id="pickupLocation"
                name="pickupLocation"
                placeholder="Select pickup location"
              />
              {errors.pickupLocation && (
                <p id="pickupLocation-error" role="alert" className="text-xs text-destructive">
                  {errors.pickupLocation.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnLocation">Return Location</Label>
              <LocationSelect
                id="returnLocation"
                name="returnLocation"
                placeholder="Select return location"
              />
              {errors.returnLocation && (
                <p id="returnLocation-error" role="alert" className="text-xs text-destructive">
                  {errors.returnLocation.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-sm mb-6 bg-card border-none">
        <h3 className="font-semibold text-lg text-foreground mb-4">
          Personal Information
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                {...register("firstName", {
                  required: "First name is required",
                })}
                className={errors.firstName ? "border-destructive" : ""}
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <p id="firstName-error" role="alert" className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                {...register("lastName", { required: "Last name is required" })}
                className={errors.lastName ? "border-destructive" : ""}
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
              />
              {errors.lastName && (
                <p id="lastName-error" role="alert" className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
                className={errors.email ? "border-destructive" : ""}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XX XXX XXX"
                autoComplete="tel"
                {...register("phone", { required: "Phone number is required" })}
                className={errors.phone ? "border-destructive" : ""}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {errors.phone && (
                <p id="phone-error" role="alert" className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {loadingLabel}
          </>
        ) : showPriceEstimate && estimateDays > 0 ? (
          `Continue · KSh ${estimatedTotal.toLocaleString("en-KE")}`
        ) : !showPriceEstimate ? (
          "Submit viewing request"
        ) : (
          "Continue to payment"
        )}
      </Button>
    </form>
  );
}
