import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCarById, getAvailableCars } from "@/lib/services/cars";
import { CarDetailsClient } from "@/components/cars/car-details-client";
import type { Metadata } from "next";
import type { Car } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 900;

export async function generateStaticParams() {
  try {
    const cars = await getAvailableCars();
    return cars.map((car) => ({
      id: car.id.toString(),
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const car = await getCarById(id);
    const description =
      car.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
      `Explore the ${car.year} ${car.name} ${car.model} for hire in Nairobi, Kenya. Check availability, daily rate and vehicle details with Cosmara.`;
    const image = car.image ?? car.images?.[0] ?? "/hero/car1.webp";
    return {
      title: `${car.name} ${car.model} for Hire in Nairobi`,
      description,
      alternates: {
        canonical: `/cars/${encodeURIComponent(id)}`,
      },
      openGraph: {
        title: `${car.name} ${car.model} Car Hire | Cosmara Nairobi`,
        description,
        url: `https://cosmara.co.ke/cars/${encodeURIComponent(id)}`,
        type: "website",
        images: [image],
      },
      twitter: {
        card: "summary_large_image",
        title: `${car.name} ${car.model} for Hire in Nairobi`,
        description,
        images: [image],
      },
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
  let car: Car;

  try {
    car = await getCarById(id);
  } catch {
    notFound();
  }

  const image = car.image ?? car.images?.[0] ?? "/hero/car1.webp";
  const vehicleData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${car.name} ${car.model}`,
    image: image.startsWith("http")
      ? image
      : `https://cosmara.co.ke/${image.replace(/^\/+/, "")}`,
    description:
      car.description ??
      `${car.name} ${car.model} available for hire in Nairobi, Kenya.`,
    serviceType: "Daily car rental",
    areaServed: [
      { "@type": "City", name: "Nairobi" },
      { "@type": "Country", name: "Kenya" },
    ],
    provider: { "@id": "https://cosmara.co.ke/#business" },
    offers: {
      "@type": "Offer",
      url: `https://cosmara.co.ke/cars/${encodeURIComponent(car.id)}`,
      price: car.price,
      priceCurrency: "KES",
      description: "Daily vehicle rental rate; confirm dates and availability when booking.",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: car.price,
        priceCurrency: "KES",
        unitText: "DAY",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vehicleData).replace(/</g, "\\u003c"),
        }}
      />
      <CarDetailsClient car={car} />
    </>
  );
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
