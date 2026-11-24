"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookingForm,
  BookingFormData,
} from "@/components/booking/booking-form";
import { EmptyState } from "@/components/common/empty-state";
import { MpesaPaymentDialog } from "@/components/booking/mpesa-payment-dialog";
import { toast } from "sonner";
import { CheckCircle, Copy } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { Car } from "@/types";
import { useMpesaPayment } from "@/hooks/use-mpesa-payment";

export default function BookingClientPage({ car }: { car: Car | null }) {
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const supabase = createClient();

  const payment = useMpesaPayment({
    onPaid: async () => {
      if (!car) return;
      try {
        await supabase.from("cars").update({ available: false }).eq("id", car.id);
      } catch (carError) {
        console.error("Failed to update car availability:", carError);
      }
      toast.success("Payment confirmed! Your car is booked.");
    },
  });

  const calcDays = (data: BookingFormData) => {
    const ms =
      new Date(data.returnDate).getTime() - new Date(data.pickupDate).getTime();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const handleBooking = async (data: BookingFormData) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (data.pickupDate < today) {
      throw new Error("Pickup date cannot be in the past.");
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to make a booking.");
        return;
      }
      if (!car) throw new Error("Car not found.");
      if (data.returnDate <= data.pickupDate) {
        throw new Error("Return date must be after pickup date.");
      }
      if (!car.available) {
        throw new Error("Sorry, this car is no longer available.");
      }

      const days = calcDays(data);
      const total = days * car.price;

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          car_id: car.id,
          profile_id: user.id,
          pickup_date: new Date(data.pickupDate).toISOString(),
          return_date: new Date(data.returnDate).toISOString(),
          pickup_location: data.pickupLocation,
          return_location: data.returnLocation,
          total_price: total,
          status: "pending",
          days,
        })
        .select()
        .single();

      if (bookingError || !newBooking) {
        throw new Error(bookingError?.message ?? "Failed to create booking.");
      }

      setBookingData(data);

      // The engine listens for the result and polls as a fallback. It never
      // fails the booking before the prompt is sent.
      payment.start({
        pollType: "booking",
        phone: data.phone,
        watch: {
          table: "bookings",
          id: newBooking.id,
          statusColumn: "status",
          paidValue: "confirmed",
          failedValue: "failed",
          reasonColumn: "payment_failure_reason",
          receiptColumn: "mpesa_receipt_number",
          amountColumn: "paid_amount",
        },
        initiate: async () => {
          const stkResponse = await fetch("/api/mpesa/stkpush", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: data.phone,
              amount: total,
              bookingId: newBooking.id,
            }),
          });
          const stkData = await stkResponse.json();

          if ((!stkResponse.ok || !stkData.success) && !stkData.paymentMayBePending) {
            const { error: failureUpdateError } = await supabase
              .from("bookings")
              .update({ status: "failed", payment_failure_reason: stkData.error })
              .eq("id", newBooking.id);
            if (failureUpdateError) {
              console.error("[BookingPage] Could not record rejected M-Pesa request:", failureUpdateError);
            }
            return { success: false, error: stkData.error ?? "M-Pesa request failed." };
          }

          return {
            success: Boolean(stkData.success),
            error: stkData.error ?? null,
            paymentMayBePending: Boolean(stkData.paymentMayBePending),
          };
        },
      });
    } catch (err: unknown) {
      console.error("[BookingPage] handleBooking error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
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

  const totalAmount = bookingData ? calcDays(bookingData) * car.price : 0;

  if (payment.phase === "success" && bookingData) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground text-sm">
              Your {car.name} has been reserved. A confirmation will be sent to
              your phone.
            </p>
          </div>

          {payment.outcome.receiptNumber && (
            <div className="bg-card border border-border rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                M-Pesa Receipt
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-foreground">
                  {payment.outcome.receiptNumber}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payment.outcome.receiptNumber!);
                    toast.success("Receipt number copied!");
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Amount paid:{" "}
                <span className="text-foreground font-medium">
                  Ksh {(payment.outcome.amount ?? totalAmount).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-center hover:opacity-90 transition-opacity"
            >
              View My Bookings
            </Link>
            <Link
              href="/cars"
              className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium text-center hover:bg-muted/80 transition-colors"
            >
              Browse More Cars
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isProcessingPayment =
    payment.phase === "processing" || payment.phase === "waiting";

  return (
    <>
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <MpesaPaymentDialog
          canResend={payment.canResend}
          onResend={payment.resend}
          open={payment.phase !== "idle"}
          state={payment.phase === "idle" ? "processing" : payment.phase}
          phone={bookingData?.phone}
          amount={bookingData ? calcDays(bookingData) * car.price : null}
          description="car rental"
          message={payment.message}
          canDismiss={payment.slow}
          onClose={payment.reset}
          onRetry={payment.reset}
        />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <BookingForm
              carName={car.name}
              dailyRate={car.price}
              onSubmit={handleBooking}
              isLoading={isProcessingPayment}
            />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 sticky top-24 shadow-sm">
              <h3 className="font-semibold text-foreground">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Vehicle</span>
                  <span className="text-foreground font-medium">
                    {car.name}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Daily rate</span>
                  <span className="text-foreground font-medium">
                    Ksh {car.price.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground border-t border-border pt-4">
                The rental estimate is based on your selected dates and daily
                rate. Confirm the amount before paying. M-Pesa will send a
                secure prompt to the phone number you provide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
