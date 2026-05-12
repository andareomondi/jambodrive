"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image"; // Improved performance
import Link from "next/link";
import {
  HelpCircle,
  ArrowRight,
  Check,
  Shield,
  Clock,
  MapPin,
  Loader2,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { HeroBookingForm } from "@/components/booking/hero-booking-form";
import { HelpSupportModal } from "@/components/modals/help-support-modal";
import { createClient } from "@/lib/supabase/client";
import { DatabaseService } from "@/lib/services";
import type { Car } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const HERO_IMAGES = [
  { src: "/hero/car1.jpg", alt: "Premium sedan" },
  { src: "/hero/car2.jpg", alt: "SUV at sunset" },
  { src: "/hero/car3.jpg", alt: "Sports car" },
];

const SLIDE_DURATION = 6000;

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(next, SLIDE_DURATION);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next]);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-slate-950">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
              quality={85}
            />
            {/* Multi-layer overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-20 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div>
              <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-bold tracking-wide uppercase">
                Premium Car Rental
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Drive Your <span className="text-orange-500">Dream</span> Car
                Today.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-lg leading-relaxed">
                Experience luxury and performance with our exclusive fleet.
                Seamless booking, 24/7 support, and no hidden fees.
              </p>
            </div>

            <div className="flex flex-wrap gap-6">
              {[
                { label: "Fleet Size", value: "100+" },
                { label: "Happy Clients", value: "10k+" },
                { label: "Support", value: "24/7" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold text-orange-400">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-16 max-w-6xl">
            <HeroBookingForm />
          </div>
        </div>
      </div>

      {/* Modern Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current
                ? "w-12 bg-orange-500"
                : "w-3 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const db = useMemo(() => new DatabaseService(supabase), [supabase]);

  useEffect(() => {
    db.getCars()
      .then((all) => {
        setCars(all.filter((c) => c.type === "ssuv").slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [db]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-orange-500/30">
      <Navbar />
      <HeroCarousel />

      {/* Feature Grid with better visual balance */}
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

      {/* Featured Vehicles Section */}
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

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating Support UI */}
      <Button
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all z-50 ring-4 ring-orange-600/20"
        size="icon"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      <HelpSupportModal open={helpModalOpen} onOpenChange={setHelpModalOpen} />
      <Footer />
    </div>
  );
}
