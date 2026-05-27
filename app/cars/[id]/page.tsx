import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatabaseService } from "@/lib/services";
import { CarDetailsClient } from "./car-details-client";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

// Next.js 15: params is a Promise
interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const db = new DatabaseService(supabase);

  try {
    const car = await db.getCarById(id);
    if (!car) return { title: "Car Not Found" };

    return {
      title: `${car.name} — ${car.model}`,
      description:
        car.description?.slice(0, 155) ??
        `Hire the ${car.name} for Ksh ${car.price}/day in Nairobi, Kenya.`,
      openGraph: {
        title: `${car.name} | Cosmara Car Hire`,
        description: `${car.model} · Ksh ${car.price}/day · ${car.seats} seats · ${car.transmission}`,
        images: car.images?.[0]
          ? [{ url: car.images[0], width: 1200, height: 630, alt: car.name }]
          : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${car.name} | Cosmara Car Hire`,
        description: `Hire the ${car.name} for Ksh ${car.price}/day in Nairobi.`,
        images: car.images?.[0] ? [car.images[0]] : [],
      },
    };
  } catch {
    return { title: "Car Not Found" };
  }
}

export default async function CarDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const db = new DatabaseService(supabase);

  let car;
  try {
    car = await db.getCarById(id);
  } catch {
    notFound();
  }

  if (!car) notFound();

  const allCars = await db.getCars();
  const relatedCars = allCars
    .filter((c) => c.type === car.type && c.id !== car.id)
    .slice(0, 3);

  return (
    <>
      <CarDetailsClient car={car} relatedCars={relatedCars} />
      <Footer />
    </>
  );
}
