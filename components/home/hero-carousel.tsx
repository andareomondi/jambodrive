"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AppImage } from "@/components/ui/app-image";
import { HeroBookingForm } from "@/components/booking/hero-booking-form";

const HERO_IMAGES = [
  { src: "/hero/car1.webp", alt: "Premium sedan on Nairobi roads" },
  { src: "/hero/car2.webp", alt: "SUV at sunset in Kenya" },
  { src: "/hero/car3.webp", alt: "Luxury sports car" },
  { src: "/hero/car4.webp", alt: "Finest cars in the market" },
] as const;

const SLIDE_DURATION = 6000;

const STATS = [
  { label: "Fleet Size", value: "100+" },
  { label: "Happy Clients", value: "10k+" },
  { label: "Support", value: "24/7" },
] as const;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, SLIDE_DURATION);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const goTo = (i: number) => {
    setCurrent(i);
    resetTimer();
  };

  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-[hsl(80_14%_8%)]">
      <div className="absolute inset-0 z-0">
        {HERO_IMAGES.map((img, i) => {
          const nextIndex = (current + 1) % HERO_IMAGES.length;
          if (i !== current && i !== nextIndex) return null;

          return (
            <div
              key={img.src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === current ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <AppImage
                src={img.src}
                alt={img.alt}
                fill
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                unoptimized
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(80_14%_8%/0.88)] via-[hsl(80_14%_8%/0.55)] to-[hsl(80_14%_8%/0.1)] z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(80_14%_8%/0.7)] via-transparent to-transparent z-10" />
            </div>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-20 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full border border-white/15 bg-white/5 text-[hsl(42_25%_91%)] text-[11px] font-semibold tracking-[0.18em] uppercase backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Premium Car Rental
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-medium text-[hsl(45_30%_97%)] leading-[0.95] tracking-[-0.04em]">
                Drive your
                <span className="block text-accent">Perfect moment.</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-[hsl(45_30%_97%/0.76)] max-w-lg leading-relaxed">
                Elevate every journey with hand-picked luxury vehicles, effortless booking,
                and white-glove support made for Nairobi and beyond.
              </p>
            </div>

            <div className="flex flex-wrap gap-8">
              {STATS.map((stat) => (
                <div key={stat.label} className="min-w-[88px]">
                  <p className="text-3xl font-bold text-accent">{stat.value}</p>
                  <p className="text-[10px] text-[hsl(45_30%_97%/0.6)] font-medium uppercase tracking-[0.18em] mt-1.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <HeroBookingForm />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current
                ? "w-12 bg-accent"
                : "w-3 bg-[hsl(45_30%_97%/0.35)] hover:bg-[hsl(45_30%_97%/0.55)]"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
