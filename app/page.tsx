"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { HeroBookingForm } from "@/components/booking/hero-booking-form";
import {
  ArrowRight,
  Check,
  Shield,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HelpSupportModal } from "@/components/modals/help-support-modal";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { DatabaseService } from "@/lib/services";
import type { Car } from "@/lib/mock-data";

export const dynamic = "auto";

const HERO_IMAGES = [
  { src: "/hero/car1.jpg", alt: "Premium sedan on open road" },
  { src: "/hero/car2.jpg", alt: "SUV at sunset" },
  { src: "/hero/car3.jpg", alt: "Sports car on highway" },
  { src: "/hero/car4.jpg", alt: "Luxury vehicle in city" },
  { src: "/hero/car5.jpg", alt: "4x4 off-road adventure" },
];

const SLIDE_DURATION = 5000; // ms per slide
const TRANSITION_DURATION = 800; // ms fade duration

// ─── HeroCarousel ─────────────────────────────────────────────────────────────
function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      setPrev(current);
      setCurrent(index);
      setIsTransitioning(true);
      setTimeout(() => {
        setPrev(null);
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
    },
    [current, isTransitioning],
  );

  const next = useCallback(() => {
    goTo((current + 1) % HERO_IMAGES.length);
  }, [current, goTo]);

  const prev_ = useCallback(() => {
    goTo((current - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  }, [current, goTo]);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setTimeout(next, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [next, current]);

  return (
    <section
      className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-28 overflow-hidden min-h-[620px]"
      aria-label="Hero section with image carousel"
    >
      {/* ── Background slides ── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {HERO_IMAGES.map((img, i) => {
          const isActive = i === current;
          const isPrev = i === prev;

          return (
            <div
              key={img.src}
              className="absolute inset-0 transition-opacity"
              style={{
                opacity: isActive ? 1 : isPrev ? 0 : 0,
                transitionDuration: `${TRANSITION_DURATION}ms`,
                transitionTimingFunction: "ease-in-out",
                willChange: "opacity",
                // Only render DOM for active + adjacent slides for perf
                display:
                  isActive || isPrev || Math.abs(i - current) <= 1
                    ? "block"
                    : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          );
        })}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        {/* Subtle gradient at bottom for text legibility */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Hero Text */}
        <div className="mb-16 max-w-2xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 text-balance leading-tight tracking-tight drop-shadow-lg text-orange-400">
            Search Your <br className="block" />
            Best Cars <br />
            Here.
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-xl text-balance drop-shadow-md font-medium">
            Find your perfect rental in seconds. Premium vehicles, flexible
            terms, instant booking.
          </p>
        </div>

        {/* Booking Form */}
        <div className="mb-16 max-w-6xl">
          <HeroBookingForm />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl">
          {[
            { number: "500+", label: "Premium Vehicles" },
            { number: "50K+", label: "Happy Customers" },
            { number: "24/7", label: "Support" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-left group hover:scale-105 transition-transform duration-300"
            >
              <p className="text-3xl md:text-4xl font-black text-orange-400 drop-shadow-lg">
                {stat.number}
              </p>
              <p className="mt-2 text-white/90 text-sm md:text-base font-medium drop-shadow-md">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2"
        role="tablist"
        aria-label="Carousel slides"
      >
        {HERO_IMAGES.map((img, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1}: ${img.alt}`}
            onClick={() => goTo(i)}
            className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 rounded-full"
          >
            <span
              className="block rounded-full bg-white/50 group-hover:bg-white/80 transition-all duration-300"
              style={{
                width: i === current ? "28px" : "8px",
                height: "8px",
                backgroundColor: i === current ? "rgb(251 146 60)" : undefined, // orange-400
                transition: "width 300ms ease, background-color 300ms ease",
              }}
            />
          </button>
        ))}
      </div>

      {/* Progress bar */}

      <style jsx>{`
        @keyframes carousel-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const featuredCars = cars.slice(0, 3);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const supabase = createClient();
  const db = new DatabaseService(supabase);

  useEffect(() => {
    db.getCars()
      .then((allCars) => {
        const ssuvCars = allCars.filter((car) => car.type === "ssuv");
        setCars(ssuvCars);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section — now a carousel */}
      <HeroCarousel />

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-foreground text-balance leading-tight mb-4">
              Why Choose Us?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the difference with our premium service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Check,
                title: "Easy Booking",
                description:
                  "Simple and fast booking process. Reserve your car in minutes.",
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description:
                  "All vehicles inspected and insured. Your safety is our priority.",
              },
              {
                icon: Clock,
                title: "Flexible Rates",
                description:
                  "Affordable pricing with flexible rental periods and insurance options.",
              },
              {
                icon: MapPin,
                title: "Multiple Locations",
                description:
                  "Pick up and drop off at convenient locations near you.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-gray-100 dark:border-slate-700 group"
                >
                  <div className="mb-4 inline-flex p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Featured Vehicles
            </h2>
            <Button asChild variant="outline">
              <Link href="/cars" className="flex items-center gap-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </div>
      </section>

      <Button
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 z-40"
        size="icon"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <HelpSupportModal open={helpModalOpen} onOpenChange={setHelpModalOpen} />

      <Footer />
    </div>
  );
}
