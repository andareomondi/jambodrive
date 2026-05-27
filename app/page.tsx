import Link from "next/link";
import { Metadata } from "next";
import { Check, Shield, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";

// Import our newly extracted Client Components
import { HeroCarousel } from "@/components/home/hero-carousel";
import { FloatingSupport } from "@/components/home/floating-support";

import { createClient } from "@/lib/supabase/server";
import { DatabaseService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Premium Car Rentals | Drive Your Dream Car Today",
  description:
    "Experience luxury and performance with our exclusive fleet. Seamless booking, 24/7 support, and no hidden fees.",
  openGraph: {
    title: "Premium Car Rentals",
    description: "Experience luxury and performance with our exclusive fleet.",
    images: ["/hero/car1.jpg"],
  },
};

async function getFeaturedCars() {
  const supabase = await createClient();
  const db = new DatabaseService(supabase);

  try {
    const allCars = await db.getCars();
    return allCars.filter((c) => c.type === "ssuv").slice(0, 3);
  } catch (error) {
    console.error("Failed to fetch cars:", error);
    return [];
  }
}

export default async function Home() {
  const cars = await getFeaturedCars();

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-orange-500/30">
      <Navbar />

      <HeroCarousel />

      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              The Easiest Way to Rent
            </h2>
            <p className="text-muted-foreground text-lg">
              We've streamlined the entire process so you can focus on the road
              ahead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Check,
                title: "Instant Booking",
                desc: "Real-time availability and immediate confirmation.",
              },
              {
                icon: Shield,
                title: "Premium Insurance",
                desc: "Comprehensive coverage included with every rental.",
              },
              {
                icon: Clock,
                title: "Flexible Timing",
                desc: "Daily, weekly, or monthly rates tailored to you.",
              },
              {
                icon: MapPin,
                title: "Free Delivery",
                desc: "We bring the car to your doorstep or hotel.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-secondary/50 border border-border/50 hover:border-orange-500/50 transition-all duration-500"
              >
                <div className="mb-5 w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Our Featured Fleet
              </h2>
              <p className="text-muted-foreground">
                Hand-picked luxury vehicles for your next journey.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="hidden md:flex hover:text-orange-600 transition-colors"
            >
              <Link href="/cars" className="group">
                Browse Entire Fleet
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.length > 0 ? (
              cars.map((car) => <CarCard key={car.id} car={car} />)
            ) : (
              <p className="col-span-full text-center text-muted-foreground">
                Currently updating our fleet. Check back soon!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Extracted Client Widget */}
      <FloatingSupport />

      <Footer />
    </div>
  );
}
