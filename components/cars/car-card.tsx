"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Fuel, Zap } from "lucide-react";
import type { Car } from "@/types";

interface CarCardProps {
  car: Car;
  days?: number;
}

const FUEL_ICON: Record<string, React.ReactNode> = {
  petrol:   <Fuel className="w-3.5 h-3.5" />,
  diesel:   <Fuel className="w-3.5 h-3.5" />,
  hybrid:   <Zap  className="w-3.5 h-3.5" />,
  electric: <Zap  className="w-3.5 h-3.5" />,
};

function formatType(type: string | null) {
  if (!type) return null;
  if (type === "ssuv")    return "Luxury SUV";
  if (type === "wedding") return "Wedding & Event";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function CarCard({ car, days }: CarCardProps) {
  return (
    <Link href={`/cars/${car.id}`} className="group block h-full">
      <Card className="p-2 overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border">

        {/* Image */}
        <div className="relative h-52 bg-muted rounded-md overflow-hidden">
          {car.image && (
            <Image
              src={car.image}
              alt={car.name}
              fill
              loading="eager"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}

          {/* Availability badge */}
          <div className="absolute top-3 right-3">
            {car.available ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground shadow-sm backdrop-blur-sm">
                Available
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-black/70 text-white shadow-sm backdrop-blur-sm">
                Rented
              </span>
            )}
          </div>

          {/* Unavailable overlay */}
          {!car.available && (
            <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
              <span className="text-background font-semibold text-sm">
                Not Available
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-3">
          <div>
            <h3 className="font-semibold text-base text-foreground leading-tight">
              {car.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{car.model}</span>
              {car.type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {formatType(car.type)}
                </Badge>
              )}
            </div>
          </div>

          {/* Specs row */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center gap-1">
              {FUEL_ICON[car.fuel] ?? <Fuel className="w-3.5 h-3.5" />}
              <span className="capitalize">{car.fuel}</span>
            </div>
          </div>

          {/* Price row */}
          <div className="flex items-end justify-between pt-1">
            <div>
              <p className="text-lg font-bold text-accent">
                Ksh {car.price.toLocaleString()}
              </p>
              {days && days > 1 ? (
                <p className="text-xs text-accent/70 font-medium">
                  Ksh {(car.price * days).toLocaleString()} for {days} day{days > 1 ? "s" : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">/ day</p>
              )}
              {/* Chauffeured Notice */}
              {car.chauffeured && (
                <p className="text-[11px] font-semibold text-accent mt-0.5">
                  Includes Driver
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={!car.available}
              tabIndex={-1} // parent Link handles navigation
            >
              View
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
