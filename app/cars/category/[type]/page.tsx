"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { EmptyState } from "@/components/common/empty-state";
import { Car as CarIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DatabaseService } from "@/lib/services";
import type { Car } from "@/lib/mock-data";

export default function CategoryPage() {
  const params = useParams();
  const type = params.type as string; // Captures the 'type' from the URL[cite: 4]

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);
  const db = useMemo(() => new DatabaseService(supabase), [supabase]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const allCars = await db.getCars();
        // Filter cars strictly by the URL category[cite: 4]
        const filtered = allCars.filter(
          (car) => car.type.toLowerCase() === type.toLowerCase(),
        );
        setCars(filtered);
      } catch (error) {
        console.error("Error fetching fleet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [db, type]);

  const displayTitle =
    type === "ssuv"
      ? "Luxury SUV"
      : type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {displayTitle} Fleet
          </h1>
          <p className="text-muted-foreground">
            Discover our curated selection of {displayTitle} vehicles
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
          </div>
        ) : cars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CarIcon}
            title={`No ${displayTitle}s Available`}
            description="We currently don't have vehicles in this category. Please check back later or browse our full fleet."
            action={{ label: "View All Cars", href: "/cars" }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
