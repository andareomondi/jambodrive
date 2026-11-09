import { Suspense } from "react";
import { getCars } from "@/lib/services/cars";
import { FilterableCarGrid } from "@/components/cars/filterable-car-grid";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import { Car } from "@/types";

export const revalidate = 900; // Keep ISR enabled for fast edge delivery

export const metadata: Metadata = {
  title: "Affordable Car Hire Fleet in Nairobi",
  description:
    "Browse cars for hire in Nairobi, Kenya. Compare available economy, compact, executive, SUV and premium vehicles, check daily rates and book online.",
  alternates: {
    canonical: "/cars",
  },
  openGraph: {
    title: "Cars for Hire in Nairobi | Cosmara",
    description:
      "Compare available rental cars and daily rates in Nairobi, Kenya, from economy vehicles to SUVs and premium cars.",
    url: "https://cosmara.co.ke/cars",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cars for Hire in Nairobi | Cosmara",
    description:
      "Compare available rental cars and rates in Nairobi, Kenya.",
  },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// ⚡ Sleek Shimmer Skeleton Placeholder Grid matching the CarCard layout
function CarCatalogSkeletonGrid() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-2 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded-xl" />
        <div className="h-4 w-48 bg-muted/70 rounded-lg" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex gap-3 mb-8 animate-pulse">
        <div className="h-10 flex-1 bg-muted rounded-xl" />
        <div className="h-10 w-24 bg-muted rounded-xl" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card
            key={i}
            className="relative overflow-hidden h-[400px] flex flex-col justify-between bg-card/60 border-border/60 rounded-2xl p-4 animate-pulse"
          >
            {/* Image Skeleton */}
            <div className="w-full h-56 bg-muted rounded-xl" />

            {/* Details Skeleton */}
            <div className="space-y-3 py-3">
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-muted rounded-md" />
                <div className="h-3 w-16 bg-muted rounded-md" />
              </div>
              <div className="h-3 w-24 bg-muted/70 rounded-md" />

              <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                <div className="h-3 w-16 bg-muted/60 rounded-md" />
                <div className="h-3 w-16 bg-muted/60 rounded-md" />
              </div>
            </div>

            {/* Bottom CTA Skeleton */}
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <div className="h-5 w-24 bg-muted rounded-md" />
              <div className="h-10 w-full max-w-[120px] bg-muted rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function FleetContent({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  let initialCars: Car[] = [];

  try {
    initialCars = await getCars();
  } catch (error) {
    console.error("Error fetching fleet on server:", error);
  }

  return (
    <FilterableCarGrid
      initialCars={initialCars}
      searchParams={resolvedSearchParams}
    />
  );
}

export default function CarsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={<CarCatalogSkeletonGrid />}>
        <FleetContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
