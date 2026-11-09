import type { Metadata } from "next";
import { getCars } from "@/lib/services/cars";
import { WeddingEventClient } from "@/components/wedding/wedding-event-client";

export const metadata: Metadata = {
  title: "Wedding Car Hire & Event Transport in Kenya | Cosmara",
  description:
    "Plan wedding transport around your budget, date, preferred vehicle types, colour scheme, and sample cars from Cosmara's fleet.",
  alternates: { canonical: "/wedding-events" },
};

export default async function WeddingEventsPage() {
  const cars = await getCars();

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:py-14">
      <WeddingEventClient cars={cars} />
    </main>
  );
}
