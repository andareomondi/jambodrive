"use client";

import { HelpCircle } from 'lucide-react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { HeroBookingForm } from "@/components/booking/hero-booking-form";
import { mockCars } from "@/lib/mock-data";
import { ArrowRight, Check, Shield, Clock, MapPin } from "lucide-react";
import { HelpSupportModal } from "@/components/modals/help-support-modal";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";


export default function Home() {
  const supabase = createClient();
  const featuredCars = mockCars.slice(0, 3);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 md:py-20 overflow-hidden bg-gradient-to-r from-red-600 to-red-500 bg-[url('/hero/car10.jpeg')] bg-cover bg-center before:absolute before:inset-0 before:bg-black/50">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Hero Text */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance leading-tight">
              Search Your <br />
              Best Cars <br />
              Here.
            </h1>
          </div>

          {/* Booking Form */}
          <div className="mb-12">
            <HeroBookingForm />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { number: "500+", label: "Premium Vehicles" },
              { number: "50K+", label: "Happy Customers" },
              { number: "24/7", label: "Support" },
            ].map((stat, i) => (
              <div key={i} className="text-left">
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">
                  {stat.number}
                </p>
                <p className="mt-1 text-white/80 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12 text-balance">
            Why Choose Us?
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
                  className="p-6 bg-background rounded-lg shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <Icon className="w-8 h-8 text-red-500 mb-4" />
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-balance">
            Ready to Hit the Road?
          </h2>
          <p className="text-lg text-white/90 mb-8 text-balance">
            Start your adventure today. Browse our collection and book your perfect car now.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold uppercase"
          >
            <Link href="/cars">Explore Our Fleet</Link>
          </Button>
        </div>
      </section>

      {/* Help Button */}
      <Button 
        onClick={() => setHelpModalOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 z-40"
        size="icon"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <HelpSupportModal 
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />

      <Footer />
    </div>
  );
}
