"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import {
  Fuel,
  Users,
  Zap,
  CheckCircle,
  MapPin,
  Calendar,
  Shield,
  X,
} from "lucide-react";
import { useSupabase } from "@/components/auth/supabase-provider";
import { DatabaseService } from "@/lib/services";
import type { Car } from "@/lib/mock-data";

export default function CarDetailsPage() {
  const params = useParams();
  const carId = params.id as string;
  const [selectedImage, setSelectedImage] = useState(0);
  const [car, setCar] = useState<Car | null>(null);
  const [relatedCars, setRelatedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const db = new DatabaseService(supabase);
  const [isFullscreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const carData = await db.getCarById(carId);
        if (!carData) {
          setCar(null);
          return;
        }
        setCar(carData);

        const allCars = await db.getCars();
        const filtered = allCars
          .filter((c) => c.type === carData.type && c.id !== carData.id)
          .slice(0, 3);

        setRelatedCars(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [carId]);

  const handleWhatsAppInquiry = () => {
    if (!car) return;

    const phoneNumber = "254758500943";
    const message = `Hi, I'm interested in booking the following vehicle:
*Vehicle:* ${car.name} (${car.model})
*Price:* $${car.price}/day
*Status:* ${car.available ? "Available" : "Currently Booked/Inquiry"}
*Link:* ${window.location.href}

Could you please provide more details on the booking process?`;

    const encodedMessage = encodeURIComponent(message);
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
      "_blank",
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground animate-pulse">Loading</p>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Car Not Found"
            description="The car you're looking for doesn't exist."
            action={{ label: "Back to Cars", href: "/cars" }}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/cars"
          className="inline-flex items-center text-accent hover:text-accent/80 mb-8 transition-colors"
        >
          ← Back to Cars
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <div
              className="relative h-96 bg-secondary rounded-lg overflow-hidden mb-4 cursor-pointer group"
              onClick={() => setIsFullScreen(true)}
            >
              <Image
                src={car.images[selectedImage]}
                alt={car.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
                loading="eager"
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
            {isFullscreen && (
              <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8">
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="absolute top-4 right-4 md:top-8 md:right-8 text-white hover:text-accent z-50 bg-black/50 rounded-full p-2 transition-colors"
                >
                  <X className="w-8 h-8" />
                </button>

                {/* Click outside to close */}
                <div
                  className="absolute inset-0 z-40"
                  onClick={() => setIsFullScreen(false)}
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

          <div className="lg:col-span-1">
            <Card className="p-6 shadow-medium sticky top-32">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {car.name}
                </h2>
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
                  <span className="text-sm text-muted-foreground">
                    Fuel Type
                  </span>
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

              {/* BOOKING BUTTON LOGIC */}
              <div className="space-y-3">
                {car.available && (
                  <Button
                    asChild
                    className="w-full bg-accent hover:bg-accent/90 text-base"
                  >
                    <Link href={`/booking/${car.id}`}>Book Now</Link>
                  </Button>
                )}

                {/* TEMPORARY WHATSAPP BOOKING LOGIC */}
                {!car.available && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    This vehicle is currently unavailable. You can still message
                    us to join the waitlist.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

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

      <Footer />
    </div>
  );
}
