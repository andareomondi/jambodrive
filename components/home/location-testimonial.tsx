"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, MapPin, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    id: 1,
    name: "David Ndwiga",
    role: "Business Executive",
    rating: 5,
    comment:
      "Flawless service. The Mercedes S-Class was delivered clean and on time right to my hotel. Will definitely use them again for my business trips in Nairobi.",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Travel Vlogger",
    rating: 5,
    comment:
      "Renting a Land Cruiser for our safari tour was incredibly easy. No hidden fees, great support 24/7, and the vehicle was in absolute mint condition!",
  },
  {
    id: 3,
    name: "Michael Mwangi",
    role: "Premium Client",
    rating: 5,
    comment:
      "The finest luxury car hire service in Kenya. Exceptional fleet management and smooth reservation layout. Highly professional team.",
  },
] as const;

// Auto-scroll interval duration (5 seconds)
const AUTOSCROLL_DURATION = 5000;

export function LocationTestimonial() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance to the next testimonial safely
  const nextTestimonial = useCallback(() => {
    setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  }, []);

  // Reset the timer whenever auto-scroll cycles or a user interacts
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(nextTestimonial, AUTOSCROLL_DURATION);
  }, [nextTestimonial]);

  // Handle auto-scroll setup on mount and cleanup on unmount
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  // Manual navigation control that resets the scroll timer
  const goToTestimonial = (index: number) => {
    setActiveTestimonial(index);
    resetTimer();
  };

  const googleMapEmbedUrl =
    "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3988.888112688437!2d36.807663674965596!3d-1.2372556987509498!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMcKwMTQnMTQuMSJTIDM2wrA0OCczNi45IkU!5e0!3m2!1sen!2ske!4v1783924511104!5m2!1sen!2ske";

  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold uppercase tracking-wider">
            Find Us & Reviews
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground">
            Where to Find Us & What Clients Say
          </h2>
          <p className="text-muted-foreground text-lg">
            Visit our premium showroom or read genuine feedback from our global
            community of drivers.
          </p>
        </div>

        {/* Dynamic Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Autoscrolling UX Testimonials */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="relative p-8 md:p-10 rounded-3xl bg-secondary/40 border border-border flex-1 flex flex-col justify-center overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/5 rounded-full blur-xl" />

              <Quote className="w-10 h-10 text-accent/20 mb-6 shrink-0" />

              {/* Content block swaps smoothly with a Next.js/Tailwind fade key entry */}
              <div
                key={activeTestimonial}
                className="flex-1 animate-in fade-in duration-500"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({
                    length: TESTIMONIALS[activeTestimonial].rating,
                  }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>

                <p className="text-foreground text-lg md:text-xl italic font-medium leading-relaxed mb-6">
                  "{TESTIMONIALS[activeTestimonial].comment}"
                </p>

                <div>
                  <h4 className="font-bold text-foreground text-lg">
                    {TESTIMONIALS[activeTestimonial].name}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {TESTIMONIALS[activeTestimonial].role}
                  </p>
                </div>
              </div>
            </div>

            {/* Slider / Pagination UX Controls */}
            <div className="flex items-center justify-between px-2">
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToTestimonial(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeTestimonial
                        ? "w-8 bg-accent"
                        : "w-2 bg-border hover:bg-muted-foreground/40"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5">
                <MapPin className="w-4 h-4 text-accent" />
                <span>Nairobi Headquarters</span>
              </div>
            </div>
          </div>

          {/* Right Column: Map Block */}
          <div className="lg:col-span-7 h-[400px] lg:h-auto min-h-[400px] relative rounded-3xl overflow-hidden border border-border shadow-lg">
            <iframe
              src={googleMapEmbedUrl}
              className="w-full h-full absolute inset-0 filter invert-[0.9] hue-rotate-[180deg] contrast-[1] brightness-[0.95] dark:invert-0 dark:hue-rotate-0 transition-all duration-500 rounded-3xl"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cosmara Car Hire Location Map"
            />
            <div className="absolute inset-0 pointer-events-none ring-1 ring-black/5 rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
