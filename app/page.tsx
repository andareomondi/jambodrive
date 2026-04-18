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
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { DatabaseService } from '@/lib/services'
import type { Car, Booking, User } from '@/lib/mock-data'


export default function Home() {
  const supabase = createClient();
  const db = new DatabaseService(supabase)
const [cars, setCars] = useState<Car[]>([])
  const featuredCars = cars.slice(0, 3);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

useEffect(() => {
  db.getCars().then(setCars).catch(console.error)
}, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-28 overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-red-700 bg-[url('/hero/car11.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"></div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Hero Text */}
          <div className="mb-16 max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 text-balance leading-tight tracking-tight drop-shadow-lg text-orange-400">
              Search Your <br className="hidden md:block" />
              Best Cars <br />
              Here.
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-xl text-balance drop-shadow-md font-medium">
              Find your perfect rental in seconds. Premium vehicles, flexible terms, instant booking.
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
              <div key={i} className="text-left group hover:scale-105 transition-transform duration-300">
                <p className="text-3xl md:text-4xl font-black text-orange-400 drop-shadow-lg">
                  {stat.number}
                </p>
                <p className="mt-2 text-white/90 text-sm md:text-base font-medium drop-shadow-md">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <HelpSupportModal 
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
      />

      <Footer />
    </div>
  );
}
