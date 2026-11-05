import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Check, Shield, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CarCard } from "@/components/cars/car-card";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LocationTestimonial } from "@/components/home/location-testimonial";
import { createClient } from "@/lib/supabase/server";
import type { Car } from "@/types";

export const revalidate = 900;

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

async function getFeaturedCars(): Promise<Car[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("available", true)
      .gt("price", 30000)
      .order("price", { ascending: false })
      .limit(6);

    if (error || !data) return [];
    return data as Car[];
  } catch {
    return [];
  }
}

const FEATURES = [
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
] as const;

function CarCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="relative overflow-hidden h-[380px] flex flex-col justify-between bg-card border-border rounded-2xl p-4 animate-pulse"
        >
          <div className="w-full h-52 bg-muted rounded-xl" />

          <div className="space-y-3 py-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-muted rounded-md" />
              <div className="h-3 w-16 bg-muted rounded-md" />
            </div>
            <div className="h-3 w-20 bg-muted/70 rounded-md" />

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="h-3 w-16 bg-muted/60 rounded-md" />
              <div className="h-3 w-16 bg-muted/60 rounded-md" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="h-5 w-24 bg-muted rounded-md" />
            <div className="h-9 w-28 bg-muted rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

async function FeaturedFleetGrid() {
  const cars = await getFeaturedCars();

  if (cars.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/60">
        <p className="text-muted-foreground">
          Currently updating our fleet. Check back soon!
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/cars">View All Cars</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car, index) => (
        <CarCard key={car.id} car={car} index={index} />
      ))}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background selection:bg-accent/30">
      <HeroCarousel />

      {/* ── Why choose us ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <SectionEyebrow>Why Cosmara</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">
              The Easiest Way to Rent
            </h2>
            <p className="text-muted-foreground text-lg">
              We've streamlined the entire process so you can focus on the road
              ahead.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-8 rounded-3xl bg-card border border-border hover:border-accent/50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="mb-5 w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured fleet ── */}
      <section className="py-24 bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <SectionEyebrow>The Fleet</SectionEyebrow>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                Our Featured Fleet
              </h2>
              <p className="text-muted-foreground">
                Hand-picked vehicles for your next journey.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="hidden md:flex text-foreground hover:text-accent transition-colors"
            >
              <Link href="/cars" className="group flex items-center">
                Browse Entire Fleet
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <Suspense fallback={<CarCardSkeletonGrid />}>
            <FeaturedFleetGrid />
          </Suspense>

          <div className="mt-10 flex justify-center md:hidden">
            <Button
              asChild
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8"
            >
              <Link href="/cars">Browse Entire Fleet</Link>
            </Button>
          </div>
        </div>
      </section>

      <LocationTestimonial />
    </div>
  );
}
