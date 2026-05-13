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
import {
  CheckCircle,
  Loader2,
  XCircle,
  Smartphone,
  Clock,
  PhoneCall,
  MessageCircle,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useSupabase } from "@/components/auth/supabase-provider";
import { DatabaseService } from "@/lib/services";
import type { Car } from "@/lib/mock-data";

type PaymentState = "idle" | "instructions" | "saving" | "success" | "failed";

const MPESA_NUMBER = "0758500934";

export default function BookingPage() {
  const params = useParams();
  const carId = params.carId as string;
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const supabase = useSupabase();
  const db = new DatabaseService(supabase.supabase);
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-muted-foreground font-medium">
              Preparing booking details...
            </p>
          </div>
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
            description="The vehicle you're trying to book doesn't exist or was removed."
            action={{ label: "Back to Fleet", href: "/cars" }}
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
            title="Vehicle Unavailable"
            description={`The ${car.name} is currently out on rent. Please choose another vehicle from our fleet.`}
            action={{ label: "Browse Available Cars", href: "/cars" }}
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
    return Math.max(1, days);
  };

  const handleBooking = async (data: BookingFormData) => {
    try {
      const {
        data: { user },
      } = await supabase.supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to secure this vehicle.");
        return;
      }

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
      } = await supabase.supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const days = calcDays(bookingData);
      const total = days * car.price;

      const { error } = await supabase.supabase.from("bookings").insert({
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
      toast.success("Booking submitted successfully!");
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

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-auto p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
          {isInstructions && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Complete Payment
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                To secure your booking for {days} days, please complete the
                M-Pesa transfer.
              </p>

              <div className="w-full bg-secondary/50 rounded-xl p-5 mb-6 border border-border/50">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground text-sm">
                    Amount Due
                  </span>
                  <span className="text-2xl font-bold text-foreground">
                    Ksh {total.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-border/50 w-full my-3" />
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Send to M-Pesa Number
                  </span>
                  <span className="text-xl font-bold tracking-widest text-green-600">
                    {MPESA_NUMBER}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setPaymentState("idle")}
                  className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmManualPayment}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 shadow-md shadow-green-500/20 transition-all"
                >
                  I Have Paid
                </button>
              </div>
            </>
          )}

          {isSaving && (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Verifying Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Please do not close this window...
              </p>
            </div>
          )}

          {isFailed && (
            <div className="py-4 flex flex-col items-center w-full">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Booking Failed
              </h2>
              <p className="text-sm text-muted-foreground mb-8 text-center px-4">
                {paymentMessage ||
                  "We couldn't process your booking at this time."}
              </p>
              <button
                onClick={() => setPaymentState("idle")}
                className="w-full px-6 py-3 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
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
    const refNumber = `BK${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Navbar />

        <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <Card className="overflow-hidden border-border/50 shadow-xl rounded-2xl">
            <div className="bg-green-600 p-8 text-center flex flex-col items-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 relative z-10">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-white relative z-10 mb-2">
                Booking Received!
              </h1>
              <p className="text-green-100 relative z-10 max-w-md">
                Your reservation is confirmed and pending payment verification
                by our team.
              </p>
            </div>

            <div className="p-8 bg-card">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Reference Number
                  </p>
                  <p className="text-2xl font-mono font-bold text-foreground">
                    {refNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                    Status
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    <Clock className="w-3 h-3 mr-1" /> Pending Verification
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                  <p className="font-medium text-foreground">
                    {car.name} {car.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Guest</p>
                  <p className="font-medium text-foreground">
                    {bookingData.firstName} {bookingData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pickup Date
                  </p>
                  <p className="font-medium text-foreground">
                    {bookingData.pickupDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Return Date
                  </p>
                  <p className="font-medium text-foreground">
                    {bookingData.returnDate}
                  </p>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-xl p-6 mb-8 border border-border/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Daily Rate</span>
                  <span className="font-medium">
                    Ksh {car.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{days} Days</span>
                </div>
                <div className="h-px bg-border/50 w-full mb-4" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-accent">
                    Ksh {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard"
                  className="flex-1 px-6 py-4 bg-accent text-accent-foreground rounded-xl font-semibold text-center hover:bg-accent/90 shadow-md shadow-accent/20 transition-all"
                >
                  View My Bookings
                </Link>
                <Link
                  href="/cars"
                  className="flex-1 px-6 py-4 border-2 border-border rounded-xl font-semibold text-center hover:bg-secondary transition-all"
                >
                  Browse More Cars
                </Link>
              </div>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Main Booking Page ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href={`/cars/${car.id}`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          &larr; Back to {car.name} details
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            Complete Your Booking
          </h1>
          <p className="text-lg text-muted-foreground">
            Fill out your details below to reserve the {car.name}.
          </p>
        </div>

        <PaymentModal />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border shadow-sm rounded-2xl p-1 overflow-hidden">
              <BookingForm
                carName={car.name}
                onSubmit={handleBooking}
                isLoading={isProcessingPayment}
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Communications */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Car Summary */}
            <Card className="p-6 border-border shadow-sm rounded-2xl bg-card">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Booking Summary
              </h3>
              <div className="flex gap-4 items-center mb-6">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{car.name}</p>
                  <p className="text-sm text-muted-foreground">{car.model}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent">
                    Ksh {car.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">per day</p>
                </div>
              </div>
              <div className="space-y-3 border-t border-border/50 pt-4">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Secure booking process</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span>M-Pesa accepted</span>
                </div>
              </div>
            </Card>

            {/* Dedicated Payment & Communications Card */}
            <Card className="relative overflow-hidden border-green-500/30 shadow-lg shadow-green-500/5 rounded-2xl bg-gradient-to-b from-green-500/10 to-transparent">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <PhoneCall className="w-5 h-5 text-green-700 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Payment & Support
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Please use the number below to send your{" "}
                  <strong className="text-foreground">M-Pesa payment</strong>{" "}
                  once you submit the form.
                  <br className="mb-2" />
                  You can also reach out via{" "}
                  <strong className="text-foreground">Phone</strong> or{" "}
                  <strong className="text-foreground">WhatsApp</strong> on this
                  exact line for any inquiries regarding your booking.
                </p>

                <div className="bg-background rounded-xl p-4 text-center border border-border shadow-inner relative group">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Official Line
                  </span>
                  <p className="text-3xl font-extrabold tracking-widest text-green-600 mt-2">
                    {MPESA_NUMBER}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> M-Pesa
                  </div>
                  <div className="flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> Calls
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
