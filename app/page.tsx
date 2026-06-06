import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react"; // 1. Import Suspense
import { Check, Shield, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/cars/car-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { FloatingSupport } from "@/components/home/floating-support";
import { getAvailableCars } from "@/lib/services/cars";

export const metadata: Metadata = {
  title: "Premium Car Rentals | Drive Your Dream Car Today",
  description:
    "Experience luxury and performance with our exclusive fleet. Seamless booking, 24/7 support, and no hidden fees.",
  openGraph: {
    title: "Premium Car Rentals | Drive Your Dream Car Today",
    description: "Experience luxury and performance with our exclusive fleet.",
    images: ["/hero/car1.jpg"],
  },
};

async function getFeaturedCars() {
  try {
    const cars = await getAvailableCars();
    return cars.filter((c) => c.price > 30000).slice(0, 6);
  } catch {
    return [];
  }
}

const FEATURES = [
  { icon: Check, title: "Instant Booking", desc: "Real-time availability and immediate confirmation." },
  { icon: Shield, title: "Premium Insurance", desc: "Comprehensive coverage included with every rental." },
  { icon: Clock, title: "Flexible Timing", desc: "Daily, weekly, or monthly rates tailored to you." },
  { icon: MapPin, title: "Free Delivery", desc: "We bring the car to your doorstep or hotel." },
] as const;

// 2. Extract the dynamic fleet grid into its own async component
async function FeaturedFleetGrid() {
  const cars = await getFeaturedCars();

  if (cars.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl">
        <p className="text-muted-foreground">Currently updating our fleet. Check back soon!</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/cars">View All Cars</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}

// 3. Keep the main page clean and synchronous or wrap the dynamic block
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background selection:bg-accent/30">
      {/* ── Hero ── */}
      <HeroCarousel />

      {/* ── Why choose us ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">
              The Easiest Way to Rent
            </h2>
            <p className="text-muted-foreground text-lg">
              We've streamlined the entire process so you can focus on the road ahead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-8 rounded-3xl bg-secondary/50 border border-border hover:border-accent/40 transition-all duration-300"
              >
                <div className="mb-5 w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured fleet ── */}
      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                Our Featured Fleet
              </h2>
              <p className="text-muted-foreground">Hand-picked vehicles for your next journey.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex text-foreground hover:text-accent transition-colors">
              <Link href="/cars" className="group flex items-center">
                Browse Entire Fleet
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* 4. Wrap the dynamic component in Suspense with a loading fallback */}
          <Suspense fallback={<div className="text-center py-16 text-muted-foreground">Loading our premium fleet...</div>}>
            <FeaturedFleetGrid />
          </Suspense>

          {/* Mobile browse button */}
          <div className="mt-10 flex justify-center md:hidden">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8">
              <Link href="/cars">Browse Entire Fleet</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Floating support widget ── */}
      <FloatingSupport />
    </div>
  );
}
