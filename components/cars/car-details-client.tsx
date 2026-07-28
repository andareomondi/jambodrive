"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CarCard } from "@/components/cars/car-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  Zap,
  Fuel,
  CheckCircle,
  MapPin,
  Calendar,
  Shield,
  X,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import type { Car } from "@/types";

interface CarDetailsClientProps {
  car: Car;
  relatedCars: Car[];
}

const PERKS = [
  { icon: Shield,   label: "Insurance Included" },
  { icon: Calendar, label: "Flexible Dates"      },
  { icon: MapPin,   label: "Multiple Locations"  },
] as const;

export function CarDetailsClient({ car, relatedCars }: CarDetailsClientProps) {
  const images = car.images ?? (car.image ? [car.image] : []);
  const features = car.features ?? [];

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeImage = images[selectedImage] ?? car.image;

  const handleWhatsAppInquiry = () => {
    const message = [
      `Hi, I'm interested in booking the following vehicle:`,
      `*Vehicle:* ${car.name} (${car.model})`,
      `*Price:* Ksh ${car.price}/day`,
      `*Status:* ${car.available ? "Available" : "Currently Booked — Waitlist Inquiry"}`,
      `*Link:* ${window.location.href}`,
      ``,
      `Could you please provide more details on the booking process?`,
    ].join("\n");

    window.open(
      `https://wa.me/254758500943?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

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
        {/* Images & Details */}
        <div className="lg:col-span-2">
          {activeImage ? (
            <div
              className="relative h-96 bg-muted rounded-xl overflow-hidden mb-4 cursor-pointer group"
              onClick={() => setIsFullscreen(true)}
            >
              <Image
                src={activeImage}
                alt={car.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              {!car.available && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">Not Available</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full transition-opacity">
                  Click to expand
                </span>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-muted rounded-xl mb-4 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No image available</p>
            </div>
          )}

          {isFullscreen && activeImage && (
            <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8">
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => setIsFullscreen(false)}
              />
              <div className="relative w-full h-full max-w-6xl max-h-[85vh] pointer-events-none flex items-center justify-center">
                <div className="relative w-full h-full pointer-events-auto">
                  <Image src={activeImage} alt={car.name} fill className="object-contain" priority />
                </div>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-accent bg-black/50 rounded-full p-3 transition-colors"
                aria-label="Close fullscreen"
              >
                <X className="w-6 h-6" />
              </button>
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
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image src={image} alt={`${car.name} view ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">About This Vehicle</h2>
              <p className="text-muted-foreground leading-relaxed">
                {car.description ?? "No description available."}
              </p>
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

        {/* Booking Card */}
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
                  {car.fuel === "electric" || car.fuel === "hybrid" ? (
                    <Zap className="w-4 h-4 text-accent" />
                  ) : (
                    <Fuel className="w-4 h-4 text-accent" />
                  )}
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
            </div>

            <div className="space-y-3">
              {car.available ? (
                <div className="flex flex-col gap-3">
                  <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href={`/booking/${car.id}`}>Book Now (Pay with M-Pesa)</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-accent/40 text-accent hover:bg-accent/10">
                    <Link href={`/testdrive/${car.id}`}>Request Physical Viewing</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleWhatsAppInquiry}
                    variant="outline"
                    className="w-full border-accent/40 text-accent hover:bg-accent/10 gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Join Waitlist via WhatsApp
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    This vehicle is currently unavailable. Message us to join the waitlist.
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
