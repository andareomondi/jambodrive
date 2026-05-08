"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  BookingForm,
  BookingFormData,
} from "@/components/booking/booking-form";
import { EmptyState } from "@/components/common/empty-state";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle, Smartphone, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { DatabaseService } from "@/lib/services";
import type { Car } from "@/lib/mock-data";

type PaymentState = "idle" | "instructions" | "saving" | "success" | "failed";

export default function BookingPage() {
  const params = useParams();
  const carId = params.carId as string;
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const supabase = createClient();
  const db = new DatabaseService(supabase);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getCarById(carId)
      .then(setCar)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [carId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Car Not Found"
            description="The car you're trying to book doesn't exist."
            action={{ label: "Back to Cars", href: "/cars" }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!car.available) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Car Not Available"
            description={`The ${car.name} is currently unavailable. Please choose another vehicle.`}
            action={{ label: "Browse Other Cars", href: "/cars" }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const calcDays = (data: BookingFormData) => {
    const days = Math.ceil(
      (new Date(data.returnDate).getTime() -
        new Date(data.pickupDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return Math.max(1, days); // Default to at least 1 day
  };

  const handleBooking = async (data: BookingFormData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to book a car.");
        return;
      }

      // Instead of hitting Daraja, save the form data and prompt manual payment
      setBookingData(data);
      setPaymentState("instructions");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const confirmManualPayment = async () => {
    if (!bookingData || !car) return;

    setPaymentState("saving");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const days = calcDays(bookingData);
      const total = days * car.price;

      // Save as 'pending' for admin verification
      const { error } = await supabase.from("bookings").insert({
        car_id: car.id,
        profile_id: user.id,
        pickup_date: new Date(bookingData.pickupDate).toISOString(),
        return_date: new Date(bookingData.returnDate).toISOString(),
        pickup_location: bookingData.pickupLocation,
        return_location: bookingData.returnLocation,
        total_price: total,
        status: "pending",
        days,
      });

      if (error) throw error;

      setPaymentState("success");
      toast.success("Booking submitted! Awaiting payment verification.");
    } catch (err) {
      console.error(err);
      setPaymentState("failed");
      setPaymentMessage("Failed to save your booking. Please try again.");
      toast.error("Booking creation failed.");
    }
  };

  // ─── Payment Modal ─────────────────────────────────────────────────────────
  const PaymentModal = () => {
    if (paymentState === "idle") return null;

    const isInstructions = paymentState === "instructions";
    const isSaving = paymentState === "saving";
    const isFailed = paymentState === "failed";

    let total = 0;
    let days = 0;
    if (bookingData && car) {
      days = calcDays(bookingData);
      total = days * car.price;
    }

    // Replace this placeholder with your actual M-Pesa Paybill / Till / Number
    const mpesaNumber = "0758500934";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-background rounded-2xl shadow-xl w-full max-w-md mx-4 p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
              isInstructions
                ? "bg-accent/10"
                : isSaving
                  ? "bg-accent/10"
                  : "bg-destructive/10"
            }`}
          >
            {isInstructions && <Smartphone className="w-9 h-9 text-accent" />}
            {isSaving && (
              <Loader2 className="w-9 h-9 text-accent animate-spin" />
            )}
            {isFailed && <XCircle className="w-9 h-9 text-destructive" />}
          </div>

          {/* Content */}
          {isInstructions && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Manual Payment
              </h2>

              <div className="w-full bg-secondary rounded-lg p-4 mb-6 space-y-3 text-left">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold text-foreground">
                    {days} Days
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    Amount Due:
                  </span>
                  <span className="text-xl font-bold text-accent">
                    Ksh {total}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Please send the total amount via M-Pesa to:
                <br />
                <span className="text-xl font-bold text-foreground block my-2 tracking-widest">
                  {mpesaNumber}
                </span>
                Once sent, click the button below. Our team will verify your
                payment and confirm your booking.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setPaymentState("idle")}
                  className="flex-1 px-4 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmManualPayment}
                  className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors shadow-sm"
                >
                  I Have Paid
                </button>
              </div>
            </>
          )}

          {isSaving && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Submitting Booking
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Saving your details and marking as pending verification...
              </p>
            </>
          )}

          {isFailed && (
            <>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Booking Failed
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {paymentMessage || "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => setPaymentState("idle")}
                className="w-full px-6 py-3 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const isProcessingPayment =
    paymentState !== "idle" &&
    paymentState !== "success" &&
    paymentState !== "failed";

  // ─── Booking Pending (Success) Screen ──────────────────────────────────────
  if (paymentState === "success" && bookingData) {
    const days = calcDays(bookingData);
    const total = days * car.price;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/cars"
            className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors"
          >
            ← Back to Cars
          </Link>

          <div id="booking-confirmation">
            <Card className="p-8 shadow-medium bg-gradient-to-br from-background to-secondary">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-center text-foreground mb-2">
                Booking Submitted!
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Your reservation for {car.name} has been received and is pending
                payment verification.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-background rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Reference Number
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    BK{Math.random().toString(36).substr(2, 6).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                  <p className="text-lg font-semibold text-foreground">
                    {car.name} {car.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pickup Date
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {bookingData.pickupDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Return Date
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {bookingData.returnDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pickup Location
                  </p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {bookingData.pickupLocation}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Guest Name
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {bookingData.firstName} {bookingData.lastName}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-secondary rounded-lg mb-8">
                <h3 className="font-semibold text-foreground mb-4">
                  Price Summary
                </h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Ksh {car.price} × {days} days
                    </span>
                  </div>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">
                    Total Amount
                  </span>
                  <span className="text-xl font-bold text-accent">
                    Ksh {total}
                  </span>
                </div>
                <p className="text-xs text-orange-500 mt-2">
                  * Status: Pending Verification
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-md font-medium text-center hover:bg-accent/90 transition-colors"
                >
                  View Booking in Dashboard
                </Link>
                <Link
                  href="/cars"
                  className="flex-1 px-6 py-3 border border-border rounded-md font-medium text-center hover:bg-secondary transition-colors"
                >
                  Browse More Cars
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ─── Main Booking Page ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href={`/cars/${car.id}`}
          className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors"
        >
          ← Back to Car
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-2">
          Complete Your Booking
        </h1>
        <p className="text-muted-foreground mb-8">
          Review the details and confirm your reservation for {car.name}
        </p>

        <PaymentModal />

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="lg:col-span-2">
            <BookingForm
              carName={car.name}
              onSubmit={handleBooking}
              isLoading={isProcessingPayment}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
