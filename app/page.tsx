"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { mockCars } from "@/lib/mock-data";
import { ArrowRight, Check, Shield, Clock, MapPin } from "lucide-react";

export default function Home() {
  const featuredCars = mockCars.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden h-screen justify-center items-center flex bg-[url('/hero/car8.jpg')] bg-cover bg-center">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance text-orange-500">
              Drive Your Dream Car Today
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground  max-w-2xl mx-auto text-balance mb-8 text-white text-balance ">
              Experience premium car rental with JamboDrive. Choose from
              hundreds of vehicles, book instantly, and hit the road with
              confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-base"
              >
                <Link href="/cars" className="flex items-center gap-2">
                  Browse Cars
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              { number: "500+", label: "Premium Vehicles" },
              { number: "50K+", label: "Happy Customers" },
              { number: "24/7", label: "Customer Support" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-accent">
                  {stat.number}
                </p>
                <p className="mt-2 text-white/90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12 text-balance">
            Why Choose JamboDrive?
          </h2>

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
                  className="p-6 bg-background rounded-lg shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <Icon className="w-8 h-8 text-accent mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-accent-foreground mb-6 text-balance">
            Ready to Hit the Road?
          </h2>
          <p className="text-lg text-accent-foreground/90 mb-8 text-balance">
            Start your adventure today. Browse our collection and book your
            perfect car now.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="font-semibold"
          >
            <Link href="/cars">Explore Our Fleet</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
