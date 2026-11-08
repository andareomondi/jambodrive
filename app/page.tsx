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
    images: ["/hero/car1.webp"],
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
    desc: "Real-time availability and immediate confirmation without the back-and-forth.",
  },
  {
    icon: Shield,
    title: "Premium Protection",
    desc: "Comprehensive coverage and expert support for total peace of mind.",
  },
  {
    icon: Clock,
    title: "Flexible Timing",
    desc: "Daily, weekly, or monthly plans built around how you move.",
  },
  {
    icon: MapPin,
    title: "Doorstep Delivery",
    desc: "We bring the car to your home, hotel, or airport terminal.",
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

      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-end gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
              <SectionEyebrow>Why Cosmara</SectionEyebrow>
              <h2 className="mb-4 font-display text-4xl font-medium tracking-[-0.04em] text-foreground md:text-6xl">
                Luxury without the friction
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                We’ve stripped away the stress so every reservation feels
                effortless, personal, and premium from start to finish.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }, index) => (
                <div
                  key={title}
                  className={`group relative overflow-hidden rounded-[26px] border border-border/70 bg-card/75 p-6 shadow-[0_20px_55px_rgba(0,0,0,0.14)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:bg-card ${
                    index % 2 === 1 ? "sm:translate-y-6" : ""
                  }`}
                >
                  <span className="pointer-events-none absolute -right-2 -top-8 font-display text-8xl leading-none text-foreground/[0.035] transition-colors group-hover:text-accent/10">
                    0{index + 1}
                  </span>
                  <div className="relative mb-7 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-inset ring-accent/20 transition-all duration-300 group-hover:bg-accent">
                    <Icon className="h-5 w-5 text-accent transition-colors group-hover:text-accent-foreground" />
                  </div>
                  <h3 className="relative mb-2 font-display text-2xl leading-none text-foreground">
                    {title}
                  </h3>
                  <p className="relative text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/80 bg-secondary/30 py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionEyebrow>The Fleet</SectionEyebrow>
              <h2 className="font-display text-4xl md:text-6xl font-medium tracking-[-0.04em] text-foreground mb-3">
                Curated for every kind of drive
              </h2>
              <p className="text-base text-muted-foreground">
                Hand-picked vehicles designed for business, family, comfort, and statement-making arrivals.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="hidden md:inline-flex text-foreground hover:text-accent transition-colors"
            >
              <Link href="/cars" className="group flex items-center">
                Browse Entire Fleet
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
