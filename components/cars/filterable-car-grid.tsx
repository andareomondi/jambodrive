"use client";

import { useState, useMemo } from "react";
import { CarCard } from "@/components/cars/car-card";
import { CarFilters, FilterState } from "@/components/cars/car-filters";
import { EmptyState } from "@/components/common/empty-state";
import { Car as CarIcon } from "lucide-react";
import type { Car } from "@/types"; 
interface FilterableCarGridProps {
  initialCars: Car[];
  searchParams: { [key: string]: string | string[] | undefined };
}

export function FilterableCarGrid({
  initialCars,
  searchParams,
}: FilterableCarGridProps) {
  const typeParam =
    typeof searchParams.type === "string" ? searchParams.type : undefined;
  const fromParam =
    typeof searchParams.from === "string" ? searchParams.from : undefined;
  const toParam =
    typeof searchParams.to === "string" ? searchParams.to : undefined;
const serviceParam =
  typeof searchParams.service === "string" ? searchParams.service : undefined;

  const [filters, setFilters] = useState<FilterState>({
    priceMin: 0,
    priceMax: 100000,
    carType: typeParam ? [typeParam.toLowerCase()] : [],
    transmission: [],
    fuel: [],
    search: "",
chauffeured: serviceParam === "chauffeured" ? true : serviceParam === "self-chauffeured" ? false : null,
  });

  const days = useMemo(() => {
    if (!fromParam || !toParam) return 1;
    const diffTime = Math.abs(
      new Date(toParam).getTime() - new Date(fromParam).getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }, [fromParam, toParam]);

  const filteredCars = useMemo(() => {
    return initialCars.filter((car) => {
      if (
        filters.search &&
        !car.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !car.model.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (car.price < filters.priceMin || car.price > filters.priceMax) {
        return false;
      }

      if (
        filters.carType.length > 0 &&
        !filters.carType.includes(car.type?.toLowerCase() ?? "")
      ) {
        return false;
      }

      if (
        filters.transmission.length > 0 &&
        !filters.transmission.includes(car.transmission)
      ) {
        return false;
      }

      if (filters.fuel.length > 0 && !filters.fuel.includes(car.fuel)) {
        return false;
      }
if (filters.chauffeured !== null && car.chauffeured !== filters.chauffeured) {
      return false;
    }
      return true;
    });
  }, [filters, initialCars]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Browse Our Fleet
        </h1>
        <p className="text-muted-foreground">
          Choose from {initialCars.length} premium vehicles for your next
          journey
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="w-full">
          <CarFilters onFilterChange={setFilters} />
        </div>

        <div className="w-full">
          {filteredCars.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredCars.length} of {initialCars.length} vehicles
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car) => (
                  <CarCard key={car.id} car={car} days={days} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={CarIcon}
              title="No Vehicles Found"
              description="Try adjusting your filters to find the perfect car for your journey."
            />
          )}
        </div>
      </div>
    </div>
  );
}
