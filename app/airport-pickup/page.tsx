import type { Metadata } from "next";
import { AirportPickupClient } from "@/components/booking/airport-pickup-client";
import { getActiveAirportPickupRates } from "@/lib/services/airport-pickups";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "JKIA Airport Pickup & Transfers in Nairobi",
  description:
    "Book a Nairobi airport pickup from JKIA or another configured airport. Choose your destination, confirm the fare upfront and pay securely with M-Pesa.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/airport-pickup",
  },
  openGraph: {
    title: "Nairobi Airport Pickup & Transfers | Cosmara",
    description:
      "Arrange a Nairobi airport transfer with a configured route fare, flight tracking details and secure M-Pesa payment.",
    url: "https://cosmara.co.ke/airport-pickup",
    type: "website",
    images: ["/hero/car1.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "JKIA Airport Pickup in Nairobi | Cosmara",
    description:
      "Book an airport pickup with an upfront route fare and secure M-Pesa payment.",
    images: ["/hero/car1.webp"],
  },
};

export default async function AirportPickupPage() {
  const rates = await getActiveAirportPickupRates();

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <AirportPickupClient rates={rates} />
    </main>
  );
}
