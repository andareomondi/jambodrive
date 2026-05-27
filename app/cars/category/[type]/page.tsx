import { DatabaseService } from "@/lib/services";
import { createClient } from "@/lib/supabase/server"; // Your server-side Supabase client helper
import { CarCard } from "@/components/cars/car-card";
import { EmptyState } from "@/components/common/empty-state";
import { Footer } from "@/components/layout/footer";
import { Car as CarIcon } from "lucide-react";
import { Metadata } from "next";

type Props = {
  params: Promise<{ type: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const title =
    type === "ssuv"
      ? "Luxury SUV"
      : type.charAt(0).toUpperCase() + type.slice(1);

  return {
    title: `${title} Fleet | Cozy Mobility Tours`,
    description: `Discover and book our curated selection of premium ${title} vehicles.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { type } = await params;

  // Initialize server-side Supabase connection
  const supabase = await createClient();
  const db = new DatabaseService(supabase);

  let cars = [];
  try {
    const allCars = await db.getCars();
    cars = allCars.filter(
      (car) => car.type.toLowerCase() === type.toLowerCase(),
    );
  } catch (error) {
    console.error("Error fetching category fleet:", error);
  }

  const displayTitle =
    type === "ssuv"
      ? "Luxury SUV"
      : type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {displayTitle} Fleet
          </h1>
          <p className="text-muted-foreground">
            Discover our curated selection of {displayTitle} vehicles
          </p>
        </div>

        {cars.length > 0 ? (
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
