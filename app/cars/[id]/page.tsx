import { Metadata } from "next";
import CarDetailsClient from "./car-details-client";

interface Props {
  params: Promise<{ id: string }>;
}

// Dynamically generate SEO optimization metrics
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Ideally, query your DB here on the server to make metadata hyper-accurate:
  // const car = await getServerSideCar(id);

  return {
    title: `Hire Luxury Vehicles | Cozy Mobility Tours`,
    description:
      "Browse high-end luxury vehicle rentals tailored for your ultimate safety and comfort.",
    openGraph: {
      title: "Premium Fleet Rentals",
      description:
        "Book smooth, reliable, and insured executive cars directly.",
      type: "website",
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CarDetailsClient carId={id} />;
}
