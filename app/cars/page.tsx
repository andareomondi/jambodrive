import { DatabaseService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { Footer } from "@/components/layout/footer";
import { FilterableCarGrid } from "@/components/cars/filterable-car-grid"; // We move the filter state container here
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Our Fleet | Cozy Mobility Tours",
  description:
    "Choose from our premium vehicles for your next journey. Flexible rentals, pristine cars.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CarsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const db = new DatabaseService(supabase);

  let initialCars = [];
  try {
    initialCars = await db.getCars();
  } catch (error) {
    console.error("Error fetching fleet on server:", error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Pass server-fetched cars and raw URL params directly into your client-side container 
        This eliminates the initial full-page flash/loader!
      */}
      <FilterableCarGrid
        initialCars={initialCars}
        searchParams={resolvedSearchParams}
      />
      <Footer />
    </div>
  );
}
