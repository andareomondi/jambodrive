import { Suspense } from "react";
import { getCars } from "@/lib/services/cars";
import { FilterableCarGrid } from "@/components/cars/filterable-car-grid";
import { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { Car } from "@/types";

export const metadata: Metadata = {
  title: "Browse Our Fleet | Cosmara",
  description:
    "Choose from our premium vehicles for your next journey. Flexible rentals, pristine cars.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

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
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <FleetContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
