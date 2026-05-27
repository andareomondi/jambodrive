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
  CheckCircle,
  MapPin,
  Calendar,
  Shield,
  X,
} from "lucide-react";
import type { Car } from "@/lib/mock-data";

interface CarDetailsClientProps {
  car: Car;
  relatedCars: Car[];
}

export function CarDetailsClient({ car, relatedCars }: CarDetailsClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleWhatsAppInquiry = () => {
    const phoneNumber = "254758500943";
    const message = `Hi, I'm interested in booking the following vehicle:
*Vehicle:* ${car.name} (${car.model})
*Price:* Ksh ${car.price}/day
*Status:* ${car.available ? "Available" : "Currently Booked/Inquiry"}
*Link:* ${window.location.href}

Could you please provide more details on the booking process?`;

    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/cars"
        className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors"
      >
        ← Back to Cars
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* ── Left: Images + Details ───────────────────────────── */}
        <div className="lg:col-span-2">
          {/* Main image */}
          <div
            className="relative h-96 bg-secondary rounded-lg overflow-hidden mb-4 cursor-pointer group"
            onClick={() => setIsFullscreen(true)}
          >
            <Image
              src={car.images[selectedImage]}
              alt={car.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority
            />
            {!car.available && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  Not Available
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white font-medium bg-black/50 px-4 py-2 rounded-full transition-opacity">
                Click to expand
              </span>
            </div>
          </div>

          {/* Fullscreen overlay */}
          {isFullscreen && (
            <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8">
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-accent z-50 bg-black/50 rounded-full p-2 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <div
                className="absolute inset-0 z-40"
                onClick={() => setIsFullscreen(false)}
              />
              <div className="relative w-full h-full max-w-6xl max-h-[85vh] z-50">
                <Image
                  src={car.images[selectedImage]}
                  alt={car.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}

          {/* Thumbnails */}
          {car.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 scroll-smooth snap-x">
              {car.images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 snap-start rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? "border-accent" : "border-border"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${car.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* About */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              About This Vehicle
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {car.description}
            </p>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Features
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {car.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Booking card ──────────────────────────────── */}
        <div className="lg:col-span-1">
          <Card className="p-6 shadow-medium sticky top-32">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">{car.name}</h2>
              <p className="text-muted-foreground text-sm">{car.model}</p>
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seats</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" /> {car.seats}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Transmission
                </span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {car.transmission}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fuel Type</span>
                <span className="text-sm font-medium text-foreground flex items-center gap-1 capitalize">
                  <Zap className="w-4 h-4" /> {car.fuel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Consumption
                </span>
                <span className="text-sm font-medium text-foreground">
                  {car.fuel_consumption}
                </span>
              </div>
            </div>

            <div className="mb-6 pb-6 border-b border-border">
              <div className="text-sm text-muted-foreground mb-1">
                Price per day
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-accent">
                  Ksh {car.price}
                </span>
                <span className="text-muted-foreground">/day</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {[
                { icon: Shield, label: "Insurance Included" },
                { icon: Calendar, label: "Flexible Dates" },
                { icon: MapPin, label: "Multiple Locations" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon className="w-4 h-4 text-accent" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {car.available ? (
                <Button
                  asChild
                  className="w-full bg-accent hover:bg-accent/90 text-base"
                >
                  <Link href={`/booking/${car.id}`}>Book Now</Link>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleWhatsAppInquiry}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-base"
                  >
                    Join Waitlist via WhatsApp
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    This vehicle is currently unavailable. Message us to join
                    the waitlist.
                  </p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Related cars */}
      {relatedCars.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Similar Vehicles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedCars.map((relatedCar) => (
              <CarCard key={relatedCar.id} car={relatedCar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
