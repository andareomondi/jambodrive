'use client';

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CarCard } from "@/components/cars/car-card";
import {
  Users,
  Zap,
  Fuel,
  CheckCircle,
  CreditCard,
  Clock,
  MessageCircle,
  UserCheck,
  X,
  ArrowLeft,
  Smartphone,
  Wifi,
  Copy,
  Phone,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  BookingForm,
  BookingFormData,
} from "@/components/booking/booking-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Car } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CarDetailsClientProps {
  car: Car;
  relatedCars: Car[];
}

type BookingMode = "pay_now" | "pay_later";
type ModalStep = "form" | "summary" | "processing" | "waiting_pin" | "success" | "failed";

const MPESA_SUPPORT_NUMBER = "254758500943";

export function CarDetailsClient({ car, relatedCars }: CarDetailsClientProps) {
  const images = car.images ?? (car.image ? [car.image] : []);
  const features = car.features ?? [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<BookingMode>("pay_now");
  const [modalStep, setModalStep] = useState<ModalStep>("form");
  const [formData, setFormData] = useState<BookingFormData | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  const activeImage = images[selectedImage] ?? car.image;

  const calcDays = (data: BookingFormData) => {
    const ms = new Date(data.returnDate).getTime() - new Date(data.pickupDate).getTime();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const openBookingModal = (mode: BookingMode) => {
    setBookingMode(mode);
    setModalStep("form");
    setFormData(null);
    setPaymentMessage("");
    setReceiptNumber(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: BookingFormData) => {
    setFormData(data);
    setModalStep("summary");
  };

  const handleFinalAction = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to make a booking.");
        return;
      }

      const days = calcDays(formData);
      const total = days * car.price;

      if (bookingMode === "pay_later") {
        const { error: bookingError } = await supabase.from("bookings").insert({
          car_id: car.id,
          profile_id: user.id,
          pickup_date: new Date(formData.pickupDate).toISOString(),
          return_date: new Date(formData.returnDate).toISOString(),
          pickup_location: formData.pickupLocation,
          return_location: formData.returnLocation,
          total_price: total,
          status: "pending",
          days,
        });

        if (bookingError) throw new Error(bookingError.message);
        setModalStep("success");
      } else {
        setModalStep("processing");

        const { data: newBooking, error: bookingError } = await supabase
          .from("bookings")
          .insert({
            car_id: car.id,
            profile_id: user.id,
            pickup_date: new Date(formData.pickupDate).toISOString(),
            return_date: new Date(formData.returnDate).toISOString(),
            pickup_location: formData.pickupLocation,
            return_location: formData.returnLocation,
            total_price: total,
            status: "pending",
            days,
          })
          .select()
          .single();

        if (bookingError || !newBooking) {
          throw new Error(bookingError?.message ?? "Failed to create booking.");
        }

        if (channelRef.current) channelRef.current.unsubscribe();

        const channel = supabase
          .channel(`booking_status_${newBooking.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "bookings",
              filter: `id=eq.${newBooking.id}`,
            },
            async (payload) => {
              const updated = payload.new as any;
              if (updated.status === "confirmed") {
                await supabase.from("cars").update({ available: false }).eq("id", car.id);
                setReceiptNumber(updated.mpesa_receipt_number ?? null);
                setModalStep("success");
                toast.success("Payment confirmed! Vehicle reserved.");
                channel.unsubscribe();
              } else if (updated.status === "failed") {
                setModalStep("failed");
                setPaymentMessage(updated.payment_failure_reason ?? "Payment failed.");
                channel.unsubscribe();
              }
            }
          )
          .subscribe();

        channelRef.current = channel;

        const stkResponse = await fetch("/api/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formData.phone,
            amount: total,
            bookingId: newBooking.id,
          }),
        });

        const stkData = await stkResponse.json();

        if (!stkResponse.ok || !stkData.success) {
          channel.unsubscribe();
          await supabase
            .from("bookings")
            .update({ status: "failed", payment_failure_reason: stkData.error })
            .eq("id", newBooking.id);
          throw new Error(stkData.error ?? "M-Pesa STK request failed.");
        }

        setModalStep("waiting_pin");

        setTimeout(() => {
          setModalStep((curr) => {
            if (curr === "waiting_pin") {
              channel.unsubscribe();
              setPaymentMessage("Payment request timed out. Please check your statements.");
              return "failed";
            }
            return curr;
          });
        }, 90_000);
      }
    } catch (err: unknown) {
      console.error(err);
      setModalStep("failed");
      setPaymentMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppInquiry = () => {
    const message = [
      `Hi, I'm interested in booking the following vehicle:`,
      `*Vehicle:* ${car.name} (${car.model})`,
      `*Price:* Ksh ${car.price}/day`,
      `*Link:* ${window.location.href}`,
    ].join("");
    window.open(`https://wa.me/254758500943?text=${encodeURIComponent(message)}`, "_blank");
  };

  const totalDays = formData ? calcDays(formData) : 0;
  const totalPrice = totalDays * car.price;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/cars"
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cars
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Left Image View Column */}
        <div className="lg:col-span-2">
          {activeImage ? (
            <div className="relative aspect-video w-full h-[450px] bg-muted rounded-xl overflow-hidden mb-4">
              <Image
                src={activeImage}
                alt={car.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              {!car.available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <span className="text-white text-xl font-semibold">Not Available</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[450px] bg-muted rounded-xl mb-4 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No image available</p>
            </div>
          )}

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 scroll-smooth snap-x">
              {images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 w-20 shrink-0 snap-start rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? "border-accent" : "border-border"
                  }`}
                >
                  <Image src={image} alt={`${car.name} ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">About This Vehicle</h2>
              <p className="text-muted-foreground leading-relaxed">{car.description ?? "No description available."}</p>
            </div>

            {features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Info Specs Column */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24 border-border shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">{car.name}</h2>
              <p className="text-sm text-muted-foreground">{car.model}</p>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-border text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Seats</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Users className="w-4 h-4 text-accent" /> {car.seats}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transmission</span>
                <span className="font-medium text-foreground capitalize">{car.transmission}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fuel</span>
                <span className="font-medium text-foreground flex items-center gap-1 capitalize">
                  {car.fuel === "electric" || car.fuel === "hybrid" ? <Zap className="w-4 h-4 text-accent" /> : <Fuel className="w-4 h-4 text-accent" />}
                  {car.fuel}
                </span>
              </div>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <p className="text-xs text-muted-foreground mb-1">Price per day</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-accent">Ksh {car.price.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">/day</span>
              </div>
              {car.chauffeured && (
                <div className="flex items-center gap-1.5 mt-2 text-sm font-medium text-accent">
                  <UserCheck className="w-4 h-4" />
                  <span>Price is inclusive of driver</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {car.available ? (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => openBookingModal("pay_now")}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Book & Pay Now
                  </Button>
                  <Button
                    onClick={() => openBookingModal("pay_later")}
                    variant="outline"
                    className="w-full border-accent/40 text-accent hover:bg-accent/10 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" /> Book & Pay Later
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleWhatsAppInquiry}
                  variant="outline"
                  className="w-full border-accent/40 text-accent hover:bg-accent/10 gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Join Waitlist via WhatsApp
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {relatedCars.length > 0 && (
        <div className="border-t border-border pt-16">
          <h3 className="text-2xl font-bold text-foreground mb-8">Similar Vehicles You Might Like</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedCars.map((relatedCar) => (
              <CarCard key={relatedCar.id} car={relatedCar} />
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {bookingMode === "pay_now" ? "Reserve & Pay Online" : "Book & Pay Later"}
                </h2>
                <p className="text-xs text-muted-foreground">{car.name} ({car.model})</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {modalStep === "form" && <BookingForm carName={car.name} onSubmit={handleFormSubmit} isLoading={false} />}

              {modalStep === "summary" && formData && (
                <div className="space-y-6">
                  <div className="bg-muted/40 border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground border-b border-border pb-3">Booking Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground block text-xs">Customer Name</span><span className="font-medium text-foreground">{formData.firstName} {formData.lastName}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Contact Phone</span><span className="font-medium text-foreground">{formData.phone}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Pickup Location</span><span className="font-medium text-foreground">{formData.pickupLocation}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Return Location</span><span className="font-medium text-foreground">{formData.returnLocation}</span></div>
                      <div><span className="text-muted-foreground block text-xs">Dates</span><span className="font-medium text-foreground">{formData.pickupDate} to {formData.returnDate} ({totalDays} {totalDays === 1 ? "day" : "days"})</span></div>
                      <div><span className="text-muted-foreground block text-xs">Daily Rate</span><span className="font-medium text-foreground">Ksh {car.price.toLocaleString()}</span></div>
                    </div>
                    <div className="border-t border-border pt-4 flex items-center justify-between">
                      <span className="font-semibold text-foreground">Total Estimated Price</span>
                      <span className="text-2xl font-bold text-accent">Ksh {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {bookingMode === "pay_now" ? (
                    <p className="text-xs text-muted-foreground bg-accent/10 border border-accent/20 p-3.5 rounded-xl">
                      Clicking <strong>Initiate Payment</strong> will send an M-Pesa STK push prompt directly to <strong>{formData.phone}</strong>.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted p-3.5 rounded-xl border border-border">
                      No payment required now. An admin will contact you shortly to coordinate details.
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setModalStep("form")} className="w-1/3" disabled={isSubmitting}>Edit Info</Button>
                    <Button type="button" onClick={handleFinalAction} disabled={isSubmitting} className="w-2/3">
                      {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing...</span> : bookingMode === "pay_now" ? "Initiate Payment" : "Confirm Booking"}
                    </Button>
                  </div>
                </div>
              )}

              {modalStep === "processing" && (
                <div className="py-12 flex flex-col items-center text-center gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div><h3 className="text-xl font-bold text-foreground">Connecting to M-Pesa</h3><p className="text-sm text-muted-foreground">Sending STK push prompt...</p></div>
                </div>
              )}

              {modalStep === "waiting_pin" && (
                <div className="py-8 flex flex-col items-center text-center gap-5">
                  <div className="relative w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center">
                    <Smartphone className="w-9 h-9 text-primary" />
                    <Wifi className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Check Your Phone</h3>
                    <p className="text-sm text-muted-foreground">Enter M-Pesa PIN on phone <strong>{formData?.phone}</strong> to authorize charge.</p>
                  </div>
                </div>
              )}

              {modalStep === "success" && (
                <div className="py-8 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20"><CheckCircle className="w-10 h-10 text-primary" /></div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{bookingMode === "pay_now" ? "Booking Confirmed!" : "Request Submitted!"}</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">Your reservation for the {car.name} is complete.</p>
                  </div>
                  {receiptNumber && (
                    <div className="bg-card border border-border rounded-2xl p-4 w-full text-left flex items-center justify-between">
                      <div><p className="text-xs text-muted-foreground uppercase">M-Pesa Receipt</p><span className="font-mono text-lg font-bold text-foreground">{receiptNumber}</span></div>
                      <button onClick={() => { navigator.clipboard.writeText(receiptNumber); toast.success("Copied!"); }} className="p-2 hover:bg-muted rounded-lg"><Copy className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 w-full pt-2">
                    <Link href="/dashboard" className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-center">View Bookings</Link>
                    <button onClick={() => setIsModalOpen(false)} className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium">Close</button>
                  </div>
                </div>
              )}

              {modalStep === "failed" && (
                <div className="py-8 flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20"><XCircle className="w-8 h-8 text-destructive" /></div>
                  <div><h3 className="text-xl font-bold text-foreground mb-2">Request Unsuccessful</h3><p className="text-sm text-muted-foreground">{paymentMessage}</p></div>
                  <div className="flex flex-col gap-3 w-full">
                    <Button onClick={() => setModalStep("summary")} className="w-full">Try Again</Button>
                    <a href={`tel:+${MPESA_SUPPORT_NUMBER}`} className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium text-center inline-flex items-center justify-center gap-2"><Phone className="w-4 h-4" /> Contact Support</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

