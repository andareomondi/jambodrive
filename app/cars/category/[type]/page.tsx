import { Suspense } from "react";
import { CarCard } from "@/components/cars/car-card";
import { EmptyState } from "@/components/common/empty-state";
import { Car as CarIcon, Loader2 } from "lucide-react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Car } from "@/types";

type Props = {
  params: Promise<{ type: string }>;
};

function formatDisplayTitle(type: string) {
  const labels: Record<string, string> = {
    compact: "Compact",
    economy: "Economy",
    executive: "Executive",
    suv: "SUV",
    ssuv: "Luxury SUV",
    vans: "Van",
    trucks: "Truck",
  };
  return labels[type] ?? "Car";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  const title = formatDisplayTitle(type);
  const canonical = `/cars/category/${encodeURIComponent(type)}`;

  return {
    title: `Affordable ${title} Hire in Nairobi`,
    description: `Compare available ${title.toLowerCase()} cars for hire in Nairobi, Kenya. View vehicle details and daily rates, then book online with Cosmara.`,
    alternates: { canonical },
    openGraph: {
      title: `${title} Car Hire in Nairobi | Cosmara`,
      description: `Browse available ${title.toLowerCase()} rentals in Nairobi, Kenya, with clear vehicle details and daily rates.`,
      url: `https://cosmara.co.ke${canonical}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${title} Car Hire in Nairobi | Cosmara`,
      description: `Browse ${title.toLowerCase()} rentals in Nairobi, Kenya.`,
    },
  };
}

async function getCarsByCategory(type: string): Promise<Car[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("available", true)
      .ilike("type", type);

    if (error || !data) return [];
    return data as Car[];
  } catch (error) {
    console.error("Error fetching category fleet:", error);
    return [];
  }
}

async function CategoryContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ type: string }>;
}) {
  const { type } = await paramsPromise;
  const displayTitle = formatDisplayTitle(type);
  const cars = await getCarsByCategory(type);

  return (
    <>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {displayTitle} Fleet
        </h1>
        <p className="text-muted-foreground">
          Discover our curated selection of {displayTitle} vehicles
        </p>
      </div>

      {cars.length === 0 ? (
        <EmptyState
          icon={CarIcon}
          title={`No ${displayTitle}s Available`}
          description="We currently don't have vehicles in this category. Please check back later or browse our full fleet."
          action={{ label: "View All Cars", href: "/cars" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car, index) => (
            // ⚡ Pass index to handle above-the-fold image prioritization in CarCard
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </div>
      )}
    </>
  );
}

export default function CategoryPage({ params }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          }
        >
          <CategoryContent paramsPromise={params} />
        </Suspense>
      </main>
    </div>
  );
}
