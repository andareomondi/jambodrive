"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookingForm,
  BookingFormData,
} from "@/components/booking/booking-form";
import { EmptyState } from "@/components/common/empty-state";
import { toast } from "sonner";
import { CheckCircle, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Car } from "@/types";

export default function TestDriveClientPage({ car }: { car: Car | null }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const calcDays = (data: BookingFormData) => {
    const ms =
      new Date(data.returnDate).getTime() - new Date(data.pickupDate).getTime();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const handleBooking = async (data: BookingFormData) => {
    const today = new Date();
    const pickup = new Date(data.pickupDate);
    const returnD = new Date(data.returnDate);

    if (pickup < today) throw new Error("Pickup date cannot be in the past.");
    if (returnD <= pickup)
      throw new Error("Return date must be after pickup date.");
    if (!car!.available)
      throw new Error("Sorry, this car is no longer available.");

    try {
      setIsSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to submit a request.");
        return;
      }

      const days = calcDays(data);
      const total = days * car!.price;

      const { error: bookingError } = await supabase.from("bookings").insert({
        car_id: car!.id,
        profile_id: user.id,
        pickup_date: new Date(data.pickupDate).toISOString(),
        return_date: new Date(data.returnDate).toISOString(),
        pickup_location: data.pickupLocation,
        return_location: data.returnLocation,
        total_price: total,
        status: "pending", // explicitly set to pending
        days,
      });

      if (bookingError) throw new Error(bookingError.message);

      setIsSuccess(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!car || !car.available) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="Unavailable"
          description="Car not found or unavailable."
          action={{ label: "Back to Fleet", href: "/cars" }}
        />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Request Submitted!
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Booking process initiated successfully. An admin will reach out to
              organise on how to view the car physically or complete the payment
              securely.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Link
              href="/dashboard"
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-center hover:opacity-90 transition-opacity"
            >
              View My Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Eye className="w-8 h-8 text-accent" /> Physical Viewing Request
            </h1>
            <p className="text-muted-foreground">
              Reserve this vehicle's availability tentatively to inspect it in
              person before making payment.
            </p>
          </div>
          <BookingForm
            carName={car.name}
            onSubmit={handleBooking}
            isLoading={isSubmitting}
            submitLabel="Submit Viewing Request"
          />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24 shadow-sm">
            <h3 className="font-semibold text-foreground">Estimated Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Vehicle</span>
                <span className="text-foreground font-medium">{car.name}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Daily rate</span>
                <span className="text-foreground font-medium">
                  Ksh {car.price.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-4 bg-muted/50 p-3 rounded-lg mt-4">
              <p className="font-semibold text-foreground mb-1">
                No payment required now.
              </p>
              By submitting this form, you lock in the dates tentatively. An
              admin will contact you to facilitate viewing and subsequent
              payment processing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
