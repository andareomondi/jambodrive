"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageLightbox } from "@/components/cars/image-lightbox";
import { RelatedCars } from "@/components/cars/related-cars";
import {
  Users,
  Zap,
  Fuel,
  CheckCircle,
  Shield,
  Settings2,
  CreditCard,
  Clock,
  MessageCircle,
  AlertTriangle,
  UserCheck,
  X,
  ArrowLeft,
  Smartphone,
  Wifi,
  Copy,
  Phone,
  XCircle,
  Loader2,
  Download,
  Maximize2,
} from "lucide-react";
import {
  BookingForm,
  BookingFormData,
} from "@/components/booking/booking-form";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Car, RentalSearch } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CarDetailsClientProps {
  car: Car;
  rentalSearch?: RentalSearch;
}

type BookingMode = "pay_now" | "pay_later";
type ModalStep =
  "form" | "summary" | "processing" | "waiting_pin" | "success" | "failed";

const MPESA_SUPPORT_NUMBER = "254758500943";

export function CarDetailsClient({ car, rentalSearch }: CarDetailsClientProps) {
  const images = car.images ?? (car.image ? [car.image] : []);
  const features = car.features ?? [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [imageFallbackNotice, setImageFallbackNotice] = useState<string | null>(
    null,
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<BookingMode>("pay_now");
  const [modalStep, setModalStep] = useState<ModalStep>("form");
  const [formData, setFormData] = useState<BookingFormData | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
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

  const sourceImage = images[selectedImage] ?? car.image;
  const activeImage =
    sourceImage && failedImages[sourceImage] ? "/hero/car1.webp" : sourceImage;
  const activeLoaded = !!activeImage && !!loadedImages[activeImage];
  const lightboxImages = images.map((image) =>
    failedImages[image] ? "/hero/car1.webp" : image,
  );

  const calcDays = useCallback((data: BookingFormData) => {
    const ms =
      new Date(data.returnDate).getTime() - new Date(data.pickupDate).getTime();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, []);

  const openBookingModal = (mode: BookingMode) => {
    setBookingMode(mode);
    setModalStep("form");
    setFormData(null);
    setPaymentMessage("");
    setReceiptNumber(null);
    setCreatedBookingId(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: BookingFormData) => {
    setFormData(data);
    setModalStep("summary");
  };

  const handleDownloadAgreement = async (bookingId: string) => {
    try {
      const { generateBookingReceiptPdf } =
        await import("@/lib/reports/generate-booking-receipt");
      const pdfBytes = await generateBookingReceiptPdf(bookingId);

      const blob = new Blob([pdfBytes as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cosmara-hire-agreement-${bookingId.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Hire Agreement & Contract PDF downloaded!");
    } catch (e: unknown) {
      console.error(e);
      toast.error("Failed to generate agreement PDF.");
    }
  };

  const handleFinalAction = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to make a booking.");
        return;
      }

      const days = calcDays(formData);
      const total = days * car.price;
      const modeLabel =
        bookingMode === "pay_now"
          ? "Pay Now (M-Pesa STK)"
          : "Pay Later (In-Person)";

      if (bookingMode === "pay_later") {
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
            notes: `Mode: ${modeLabel}`,
          })
          .select()
          .single();

        if (bookingError || !newBooking)
          throw new Error(bookingError?.message ?? "Failed to create booking.");

        setCreatedBookingId(newBooking.id);
        setModalStep("success");
        handleDownloadAgreement(newBooking.id);
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
            notes: `Mode: ${modeLabel}`,
          })
          .select()
          .single();

        if (bookingError || !newBooking) {
          throw new Error(bookingError?.message ?? "Failed to create booking.");
        }

        setCreatedBookingId(newBooking.id);
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
              const updated = payload.new as {
                status?: string;
                mpesa_receipt_number?: string | null;
                payment_failure_reason?: string | null;
              };
              if (updated.status === "confirmed") {
                await supabase
                  .from("cars")
                  .update({ available: false })
                  .eq("id", car.id);
                setReceiptNumber(updated.mpesa_receipt_number ?? null);
                setModalStep("success");
                toast.success("Payment confirmed! Vehicle reserved.");
                handleDownloadAgreement(newBooking.id);
                channel.unsubscribe();
              } else if (updated.status === "failed") {
                setModalStep("failed");
                setPaymentMessage(
                  updated.payment_failure_reason ?? "Payment failed.",
                );
                channel.unsubscribe();
              }
            },
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
              setPaymentMessage(
                "Payment request timed out. Please check your statements.",
              );
              return "failed";
            }
            return curr;
          });
        }, 90_000);
      }
    } catch (err: unknown) {
      console.error(err);
      setModalStep("failed");
      setPaymentMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
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
    window.open(
      `https://wa.me/254758500943?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const totalDays = formData ? calcDays(formData) : 0;
  const totalPrice = totalDays * car.price;
  const formattedType =
    car.type === "ssuv"
      ? "Luxury SUV"
      : car.type
        ? car.type.charAt(0).toUpperCase() + car.type.slice(1)
        : "Premium vehicle";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgba(236,173,110,0.12),transparent_65%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/cars"
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur transition-colors hover:border-accent/40 hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to fleet
        </Link>

        <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                {formattedType}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  car.available
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                    : "border-destructive/25 bg-destructive/10 text-destructive"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    car.available ? "bg-emerald-500" : "bg-destructive"
                  }`}
                />
                {car.available ? "Available to book" : "Currently reserved"}
              </span>
            </div>
            <h1 className="font-display text-4xl font-medium leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl md:text-6xl">
              {car.name}
              <span className="mt-1 block text-accent">{car.model}</span>
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-right">
            A considered choice for the journeys that matter. Explore the details
            and reserve your dates.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(350px,0.75fr)] lg:gap-8">
          <div className="min-w-0">
          {activeImage ? (
            <button
              type="button"
              onClick={() => activeLoaded && setLightboxOpen(true)}
              aria-label="Expand image"
              className="group relative block h-[340px] w-full cursor-zoom-in overflow-hidden rounded-[28px] border border-white/10 bg-muted text-left shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:h-[480px] lg:h-[560px]"
            >
              <AppImage
                src={activeImage}
                alt={car.name}
                fill
                className={`object-cover transition-transform duration-700 group-hover:scale-[1.025] ${activeLoaded ? "opacity-100" : "opacity-0"}`}
                priority={selectedImage === 0}
                loading={selectedImage === 0 ? "eager" : "lazy"}
                sizes="(max-width: 1024px) 100vw, 66vw"
                onLoad={() =>
                  setLoadedImages((prev) => ({ ...prev, [activeImage]: true }))
                }
                onError={() => {
                  if (sourceImage) {
                    setFailedImages((prev) => ({
                      ...prev,
                      [sourceImage]: true,
                    }));
                    setImageFallbackNotice(
                      "This vehicle image couldn't be loaded, so the backup image is being shown.",
                    );
                  }
                }}
              />

              {!activeLoaded && (
                <div className="absolute inset-0 z-20 flex animate-pulse items-center justify-center bg-muted">
                  <span className="rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground">
                    Loading vehicle image…
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
              {imageFallbackNotice && (
                <div className="absolute left-4 right-4 top-4 z-30 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100 backdrop-blur-md sm:left-6 sm:right-auto sm:top-6">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {imageFallbackNotice}
                </div>
              )}
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:left-6 sm:top-6">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {car.year} · {formattedType}
              </div>
              {activeLoaded && (
                <span className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-4 py-2.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-colors group-hover:bg-accent group-hover:text-accent-foreground sm:bottom-6 sm:right-6">
                  <Maximize2 className="h-3.5 w-3.5" /> View gallery
                </span>
              )}

              {!car.available && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                  <span className="rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                    Currently reserved
                  </span>
                </div>
              )}
            </button>
          ) : (
            <div className="flex h-[340px] items-center justify-center rounded-[28px] border border-border/70 bg-card sm:h-[480px] lg:h-[560px]">
              <p className="text-muted-foreground text-sm">
                No image available
              </p>
            </div>
          )}

          {images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto py-2 scroll-smooth snap-x">
              {images.map((image, idx) => {
                const failed = !!failedImages[image];

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all sm:h-24 sm:w-36 ${
                      selectedImage === idx
                        ? "border-accent shadow-lg shadow-accent/15"
                        : "border-border/70 opacity-75 hover:border-accent/50 hover:opacity-100"
                    }`}
                  >
                    <AppImage
                      src={failed ? "/hero/car1.webp" : image}
                      alt={`${car.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      onLoad={() =>
                        setLoadedImages((prev) => ({ ...prev, [image]: true }))
                      }
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [image]: true }));
                        setImageFallbackNotice(
                          "This vehicle image couldn't be loaded, so the backup image is being shown."
                        );
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 border-t border-border/70 pt-7 sm:mt-10 sm:pt-8">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              About the vehicle
            </p>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {car.description ?? "No description available."}
            </p>
            {features.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
                {features.map((feature, i) => (
                  <li
                    key={`${feature}-${i}`}
                    className="inline-flex items-center gap-2 text-xs font-medium text-foreground/80 sm:text-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="overflow-hidden rounded-[28px] border-border/70 bg-card/90 p-0 shadow-[0_28px_75px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="border-b border-border/70 p-5 sm:p-7">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Vehicle details
              </p>
              <h2 className="font-display text-3xl font-medium leading-none text-foreground">
                At a glance
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {[
                  { icon: Users, label: "Seats", value: String(car.seats) },
                  {
                    icon: Settings2,
                    label: "Transmission",
                    value: car.transmission,
                  },
                  {
                    icon:
                      car.fuel === "electric" || car.fuel === "hybrid"
                        ? Zap
                        : Fuel,
                    label: "Fuel",
                    value: car.fuel,
                  },
                  { icon: Clock, label: "Year", value: String(car.year) },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border/60 bg-background/45 p-3.5"
                  >
                    <Icon className="mb-3 h-4 w-4 text-accent" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold capitalize text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              {car.chauffeured && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-accent/20 bg-accent/10 px-3.5 py-3 text-xs font-semibold text-accent">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  Chauffeur included in the daily rate
                </div>
              )}
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Daily hire from
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                    KSh {car.price.toLocaleString("en-KE")}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    / day
                  </span>
                </div>
              </div>
              <div className="mb-5 flex items-center gap-2 border-y border-border/70 py-3 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 shrink-0 text-accent" />
                Flexible booking with personal support
              </div>
              <div className="space-y-3">
              {car.available ? (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => openBookingModal("pay_now")}
                    className="h-12 w-full rounded-full bg-accent font-bold text-accent-foreground shadow-lg shadow-accent/15 transition-all hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-accent/25"
                  >
                    <CreditCard className="h-4 w-4" /> Reserve this vehicle
                  </Button>
                  <Button
                    onClick={() => openBookingModal("pay_later")}
                    variant="outline"
                    className="h-12 w-full rounded-full border-border/80 bg-background/40 font-semibold text-foreground hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                  >
                    <Clock className="h-4 w-4" /> Book & pay in person
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleWhatsAppInquiry}
                  variant="outline"
                  className="h-12 w-full rounded-full border-accent/40 text-accent hover:bg-accent/10"
                >
                  <MessageCircle className="h-4 w-4" /> Ask about availability
                </Button>
              )}
              </div>
            </div>
          </Card>
        </aside>
        </div>

        <section className="mt-16 border-t border-border/70 pt-10 sm:mt-20 sm:pt-14">
          <div className="mb-8 flex items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                Keep exploring
              </p>
              <h2 className="font-display text-3xl font-medium text-foreground sm:text-4xl">
                Similar vehicles
              </h2>
            </div>
            <Link
              href="/cars"
              className="hidden items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-accent sm:inline-flex"
            >
              View full fleet <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
          <RelatedCars carId={car.id} type={car.type} />
        </section>
      </div>

      {lightboxOpen && activeImage && (
        <ImageLightbox
          images={lightboxImages}
          alt={car.name}
          index={selectedImage}
          onIndexChange={setSelectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {bookingMode === "pay_now"
                    ? "Reserve & Pay Online"
                    : "Book & Pay Later"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {car.name} ({car.model})
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {modalStep === "form" && (
                <BookingForm
                  carName={car.name}
                  dailyRate={car.price}
                  onSubmit={handleFormSubmit}
                  isLoading={false}
                  initialValues={{
                    pickupDate: rentalSearch?.pickupDate,
                    returnDate: rentalSearch?.returnDate,
                    pickupLocation: rentalSearch?.pickupLocation,
                    returnLocation: rentalSearch?.returnLocation,
                  }}
                />
              )}

              {modalStep === "summary" && formData && (
                <div className="space-y-6">
                  <div className="bg-muted/40 border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground border-b border-border pb-3">
                      Booking Summary & Terms
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Customer Name
                        </span>
                        <span className="font-medium text-foreground">
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Payment Mode
                        </span>
                        <span className="font-medium text-accent">
                          {bookingMode === "pay_now"
                            ? "Pay Now (M-Pesa STK)"
                            : "Pay Later (In-Person)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Pickup Schedule & Location
                        </span>
                        <span className="font-medium text-foreground">
                          {formData.pickupDate} ({formData.pickupLocation})
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Expected Return Schedule
                        </span>
                        <span className="font-medium text-foreground">
                          {formData.returnDate} ({formData.returnLocation})
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Rental Duration
                        </span>
                        <span className="font-medium text-foreground">
                          {totalDays} {totalDays === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">
                          Daily Rate
                        </span>
                        <span className="font-medium text-foreground">
                          Ksh {car.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        Total Estimated Price
                      </span>
                      <span className="text-2xl font-bold text-accent">
                        Ksh {totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-2 text-xs">
                    <h4 className="font-semibold text-foreground">
                      Car Hire Rules & Summary Agreement
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      <li>
                        <strong>Driver Requirements:</strong> Driver must be 21+
                        years with a valid license.
                      </li>
                      <li>
                        <strong>Fuel Policy:</strong> Vehicle is provided with a
                        full tank and must be returned full.
                      </li>
                      <li>
                        <strong>Return Timing:</strong> Expected return is
                        strictly by the agreed return date. Late returns incur
                        additional hourly/daily fees.
                      </li>
                      <li>
                        <strong>Usage:</strong> Unlimited mileage for lawful use
                        within Kenya. Off-road racing is prohibited.
                      </li>
                    </ul>
                  </div>

                  {bookingMode === "pay_now" ? (
                    <p className="text-xs text-muted-foreground bg-accent/10 border border-accent/20 p-3.5 rounded-xl">
                      Clicking <strong>Initiate Payment</strong> will send an
                      M-Pesa STK push prompt directly to{" "}
                      <strong>{formData.phone}</strong> and generate your
                      agreement contract PDF.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground bg-muted p-3.5 rounded-xl border border-border">
                      No payment required now. Confirming will generate your
                      agreement contract PDF and notify our team.
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalStep("form")}
                      className="w-1/3"
                      disabled={isSubmitting}
                    >
                      Edit Info
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFinalAction}
                      disabled={isSubmitting}
                      className="w-2/3"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Processing...
                        </span>
                      ) : bookingMode === "pay_now" ? (
                        "Initiate Payment & Contract"
                      ) : (
                        "Confirm Booking & Contract"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {modalStep === "processing" && (
                <div className="py-12 flex flex-col items-center text-center gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      Connecting to M-Pesa
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sending STK push prompt...
                    </p>
                  </div>
                </div>
              )}

              {modalStep === "waiting_pin" && (
                <div className="py-8 flex flex-col items-center text-center gap-5">
                  <div className="relative w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center">
                    <Smartphone className="w-9 h-9 text-primary" />
                    <Wifi className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Check Your Phone
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Enter M-Pesa PIN on phone{" "}
                      <strong>{formData?.phone}</strong> to authorize charge.
                    </p>
                  </div>
                </div>
              )}

              {modalStep === "success" && (
                <div className="py-8 flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/25">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {bookingMode === "pay_now"
                        ? "Booking Confirmed!"
                        : "Request Submitted!"}
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Your hire agreement contract and receipt have been
                      generated and downloaded.
                    </p>
                  </div>
                  {receiptNumber && (
                    <div className="bg-card border border-border rounded-2xl p-4 w-full text-left flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">
                          M-Pesa Receipt
                        </p>
                        <span className="font-mono text-lg font-bold text-foreground">
                          {receiptNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(receiptNumber);
                          toast.success("Copied!");
                        }}
                        className="p-2 hover:bg-muted rounded-lg"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 w-full pt-2">
                    {createdBookingId && (
                      <Button
                        onClick={() =>
                          handleDownloadAgreement(createdBookingId)
                        }
                        variant="outline"
                        className="w-full gap-2 border-accent/40 text-accent hover:bg-accent/10"
                      >
                        <Download className="w-4 h-4" /> Download Agreement
                        Contract PDF Again
                      </Button>
                    )}
                    <Link
                      href="/dashboard"
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-center"
                    >
                      View Bookings
                    </Link>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {modalStep === "failed" && (
                <div className="py-8 flex flex-col items-center text-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Request Unsuccessful
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {paymentMessage}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <Button
                      onClick={() => setModalStep("summary")}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                    <a
                      href={`tel:+${MPESA_SUPPORT_NUMBER}`}
                      className="w-full px-6 py-3 bg-muted text-foreground rounded-xl font-medium text-center inline-flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" /> Contact Support
                    </a>
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
