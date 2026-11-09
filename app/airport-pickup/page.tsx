import type { Metadata } from "next";
import { AirportPickupClient } from "@/components/booking/airport-pickup-client";
import { getActiveAirportPickupRates } from "@/lib/services/airport-pickups";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Airport Pickup | Cosmara Car Hire",
  description:
    "Book a premium airport transfer with a clear route fare and secure M-Pesa payment.",
  robots: { index: true, follow: true },
};

export default async function AirportPickupPage() {
  const rates = await getActiveAirportPickupRates();

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <AirportPickupClient rates={rates} />
    </main>
  );
}
