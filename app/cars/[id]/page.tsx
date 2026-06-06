import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCarById, getAvailableCars } from "@/lib/services/cars";
import { CarDetailsClient } from "@/components/cars/car-details-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Metadata (Awaiting params here is completely fine) ────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const car = await getCarById(id);
    return {
      title: `${car.name} — ${car.model}`,
      description: car.description?.slice(0, 155) ?? `Hire the ${car.name}.`,
    };
  } catch {
    return { title: "Car Not Found" };
  }
}

// ── Data Fetching Wrapper ─────────────────────────────────────────────────────
// We receive the promise here, inside the Suspense boundary.
async function CarDetailsData({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  // Awaiting the promise INSIDE Suspense is what clears the error!
  const { id } = await paramsPromise;

  let car;
  try {
    car = await getCarById(id);
  } catch {
    notFound();
  }

  let relatedCars: typeof car[] = [];
  try {
    const all = await getAvailableCars();
    relatedCars = all
      .filter((c) => c.type === car.type && c.id !== car.id)
      .slice(0, 3);
  } catch {
    relatedCars = [];
  }

  return <CarDetailsClient car={car} relatedCars={relatedCars} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CarDetailsPage({ params }: Props) {
  // DO NOT "await" params here. Pass the raw Promise downward.
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground animate-pulse">Loading vehicle details...</p>
        </div>
      }
    >
      <CarDetailsData paramsPromise={params} />
    </Suspense>
  );
}
