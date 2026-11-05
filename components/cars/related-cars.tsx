"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { CarCard } from "@/components/cars/car-card";
import { createClient } from "@/lib/supabase/client";
import type { Car } from "@/types";

function CarCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="relative overflow-hidden h-[380px] flex flex-col justify-between bg-card/60 border-border/60 rounded-2xl p-4 animate-pulse"
        >
          <div className="w-full h-52 bg-muted rounded-xl" />
          <div className="space-y-3 py-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-muted rounded-md" />
              <div className="h-3 w-16 bg-muted rounded-md" />
            </div>
            <div className="h-3 w-20 bg-muted/70 rounded-md" />
            <div className="flex items-center gap-3 pt-2 border-t border-border/40">
              <div className="h-3 w-16 bg-muted/60 rounded-md" />
              <div className="h-3 w-16 bg-muted/60 rounded-md" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="h-5 w-24 bg-muted rounded-md" />
            <div className="h-9 w-28 bg-muted rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

interface RelatedCarsProps {
  carId: string;
  type: string | null;
}

export function RelatedCars({ carId, type }: RelatedCarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [cars, setCars] = useState<Car[] | null>(null);

  // Mount trigger: only start loading once the section is near the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fetch only after the section is in view.
  useEffect(() => {
    if (!inView) return;
    if (!type) {
      setCars([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("cars")
      .select("*")
      .eq("type", type)
      .neq("id", carId)
      .eq("available", true)
      .limit(3)
      .then(({ data, error }) => {
        if (cancelled) return;
        setCars(error || !data ? [] : (data as Car[]));
      });
    return () => {
      cancelled = true;
    };
  }, [inView, type, carId]);

  return (
    <div ref={ref}>
      {cars === null && <CarCardSkeletonGrid />}
      {cars && cars.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((relatedCar) => (
            <CarCard key={relatedCar.id} car={relatedCar} />
          ))}
        </div>
      )}
    </div>
  );
}
