"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { HeroBookingForm } from "@/components/booking/hero-booking-form";

const HERO_IMAGES = [
  { src: "/hero/car1.jpg", alt: "Premium sedan" },
  { src: "/hero/car2.jpg", alt: "SUV at sunset" },
  { src: "/hero/car3.jpg", alt: "Sports car" },
];

const SLIDE_DURATION = 6000;

export function HeroCarousel() {
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

      {/* Slide Indicators */}
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
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
