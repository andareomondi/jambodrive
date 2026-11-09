import type { Metadata } from "next";
import { getCars } from "@/lib/services/cars";
import { WeddingEventClient } from "@/components/wedding/wedding-event-client";

export const metadata: Metadata = {
  title: "Wedding Transport & Car Hire in Nairobi, Kenya",
  description:
    "Plan wedding transport with Cosmara. Share your event date, budget, preferred vehicle types and colour scheme to request a tailored wedding car hire quote in Nairobi, Kenya.",
  keywords: [
    "wedding transport Nairobi",
    "wedding car hire Nairobi",
    "wedding cars Kenya",
    "wedding event transport Kenya",
    "wedding vehicle hire Nairobi",
  ],
  alternates: { canonical: "/wedding-events" },
  openGraph: {
    title: "Wedding Transport & Car Hire in Nairobi | Cosmara",
    description:
      "Request a tailored wedding transport quote based on your event date, budget, preferred cars and colour scheme.",
    url: "https://cosmara.co.ke/wedding-events",
    type: "website",
    images: ["/hero/car1.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Transport & Car Hire in Nairobi | Cosmara",
    description:
      "Plan event transport and request a wedding car hire quote from Cosmara.",
    images: ["/hero/car1.webp"],
  },
};

export default async function WeddingEventsPage() {
  const cars = await getCars();

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:py-14">
      <WeddingEventClient cars={cars} />
    </main>
  );
}
