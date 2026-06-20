import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCarById, getAvailableCars } from "@/lib/services/cars";
import { CarDetailsClient } from "@/components/cars/car-details-client";
import type { Metadata } from "next";
interface Props {
  params: Promise<{ id: string }>;
}
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
async function CarDetailsData({
  paramsPromise,
}: {
  paramsPromise: Promise<{ id: string }>;
}) {
  const { id } = await paramsPromise;
  let car;
  try {
    car = await getCarById(id);
  } catch {
    notFound();
  }
  let relatedCars: (typeof car)[] = [];
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
export default async function CarDetailsPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CarDetailsData paramsPromise={params} />
    </Suspense>
  );
}
