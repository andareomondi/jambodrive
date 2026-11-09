"use client";

import { AppImage } from "@/components/ui/app-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Fuel, Zap, ArrowRight, UserCheck } from "lucide-react";
import type { Car, RentalSearch } from "@/types";

interface CarCardProps {
  car: Car;
  days?: number;
  index?: number;
  rentalSearch?: RentalSearch;
}

const FUEL_ICON: Record<string, React.ReactNode> = {
  petrol: <Fuel className="w-4 h-4 text-muted-foreground" />,
  diesel: <Fuel className="w-4 h-4 text-muted-foreground" />,
  hybrid: <Zap className="w-4 h-4 text-muted-foreground" />,
  electric: <Zap className="w-4 h-4 text-muted-foreground" />,
};

function formatType(type: string | null) {
  if (!type) return null;
  if (type === "ssuv") return "Luxury SUV";
  if (type === "wedding") return "Wedding";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function CarCard({
  car,
  days,
  index = 3,
  rentalSearch,
}: CarCardProps) {
  const router = useRouter();
  const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const search = new URLSearchParams();
  if (rentalSearch?.pickupDate) search.set("from", rentalSearch.pickupDate);
  if (rentalSearch?.returnDate) search.set("to", rentalSearch.returnDate);
  if (rentalSearch?.pickupLocation) {
    search.set("pickup_location", rentalSearch.pickupLocation);
  }
  if (rentalSearch?.returnLocation) {
    search.set("dropoff_location", rentalSearch.returnLocation);
  }
  const query = search.toString();
  const targetHref = `/cars/${car.id}${query ? `?${query}` : ""}`;

  const handleMouseEnter = () => {
    if (!car.available) return;
    prefetchTimerRef.current = setTimeout(() => {
      router.prefetch(targetHref);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
      }
    };
  }, []);

  const isAboveFold = index < 3;

  return (
    <Link
      href={targetHref}
      className="group block h-full select-none active:scale-[0.99] transition-transform duration-150"
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="relative overflow-hidden h-full flex flex-col justify-between bg-card border-border/80 hover:border-accent/50 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
        {/* Top Image Section */}
        <div>
          <div className="relative h-56 w-full bg-secondary/30 overflow-hidden">
            {car.image ? (
              <AppImage
                src={car.image}
                alt={`${car.name} ${car.model}`}
                fill
                priority={isAboveFold}
                loading={isAboveFold ? "eager" : "lazy"}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No image available
              </div>
            )}

            {/* Gradient Overlay for Top Badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-70 pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
              {car.type ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                  {formatType(car.type)}
                </span>
              ) : (
                <span />
              )}

              <div>
                {car.available ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground backdrop-blur-md shadow-sm">
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground backdrop-blur-md shadow-sm">
                    Reserved
                  </span>
                )}
              </div>
            </div>

            {!car.available && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <span className="px-4 py-1.5 rounded-xl bg-background/90 text-foreground font-bold text-xs uppercase tracking-wider border border-border shadow-md">
                  Currently Rented
                </span>
              </div>
            )}
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-bold text-lg text-accent tracking-tight leading-snug">
                {car.name}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {car.model}
              </p>
            </div>

            {/* Specs Line with Driver Indicator */}
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground pt-1 ">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-accent/80" />
                <span>{car.seats} Seats</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div className="flex items-center gap-1.5">
                {FUEL_ICON[car.fuel] ?? (
                  <Fuel className="w-4 h-4 text-accent/80" />
                )}
                <span className="capitalize">{car.fuel}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <span className="capitalize">{car.transmission}</span>

              {/* Driver Badge Icon (appears after transmission if chauffeured is true) */}
              {car.chauffeured && (
                <>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <div
                    className="flex items-center gap-1 text-accent font-semibold"
                    title="Includes Driver"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Driver</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Full-Width Prominent CTA */}
        <div className="p-5 pt-0 space-y-3">
          <div className="flex items-baseline justify-between border-t border-border/50 pt-3">
            <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
              Rental Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-foreground">
                Ksh{" "}
                {days && days > 1
                  ? (car.price * days).toLocaleString()
                  : car.price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {days && days > 1 ? `for ${days}d` : "/ day"}
              </span>
            </div>
          </div>

          <div className="w-full py-3 px-4 rounded-xl bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm group-hover:bg-accent/90 group-hover:shadow-md transition-all">
            <span>{car.available ? "Book Vehicle" : "View Details"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
