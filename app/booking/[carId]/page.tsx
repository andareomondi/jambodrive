import { Metadata } from "next";
import BookingClientPage from "./booking-client";

interface Props {
  params: Promise<{ carId: string }>;
}

// Optional: If you want dynamic metadata based on the vehicle being booked
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { carId } = await params;

  return {
    title: `Complete Your Booking | Cozy Mobility`,
    description: "Secure your rental vehicle instantly via M-Pesa processing.",
    robots: { index: false, follow: true }, // Usually a good idea to keep booking paths off Google index
  };
}

export default async function Page({ params }: Props) {
  const { carId } = await params;
  return <BookingClientPage carId={carId} />;
}
