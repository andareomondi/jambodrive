"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CarCard } from "@/components/cars/car-card";
import { Card } from "@/components/ui/card";
import { HeroBookingForm } from "@/components/booking/hero-booking-form";
import { mockCars } from "@/lib/mock-data";
import { ArrowRight, Check, Shield, Clock, MapPin } from "lucide-react";
import { HelpSupportModal } from "@/components/modals/help-support-modal";
import { useState, useEffect, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { DatabaseService } from "@/lib/services";
import type { Car, Booking, User } from "@/lib/mock-data";
import { useRouter, useSearchParams } from "next/navigation";

// Extract the verification logic into its own component
function VerificationModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  useEffect(() => {
    const handleEmailVerification = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      // Only proceed if we have either a code or an error
      if (!code && !error) {
        return;
      }

      // Show modal
      setShowVerificationModal(true);

      // Handle error case
      if (error) {
        setVerificationStatus("error");

        if (errorCode === "otp_expired") {
          setVerificationMessage(
            "This verification link has expired. Please request a new one.",
          );
        } else if (errorCode === "otp_disabled") {
          setVerificationMessage("Email verification is not enabled.");
        } else {
          setVerificationMessage(
            errorDescription || "Email verification failed. Please try again.",
          );
        }
        return;
      }

      // Handle success case with code
      if (code) {
        setVerificationStatus("success");
      }
    };

    handleEmailVerification();
  }, [searchParams]);

  const closeModal = () => {
    setShowVerificationModal(false);
    // Clean up URL by removing query params
    router.replace("/");
  };

  if (!showVerificationModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md">
        {verificationStatus === "loading" && (
          <Card className="p-8 space-y-6 shadow-lg">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              </div>
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          </Card>
        )}

        {verificationStatus === "success" && (
          <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-8 space-y-6 shadow-lg">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-in fade-in scale-in duration-500">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">
                  Email Verified!
                </h1>
                <p className="text-green-800 dark:text-green-200">
                  Your email has been successfully verified. You can now log in
                  from the Cosmara app.
                </p>
              </div>

              <div className="bg-white dark:bg-black/20 rounded-lg p-4 space-y-2 text-left">
                <p className="text-sm font-semibold text-foreground">
                  What's next?
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      ✓
                    </span>
                    <span>Open the Cosmara app on your device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      ✓
                    </span>
                    <span>Log in with your verified email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      ✓
                    </span>
                    <span>
                      Start managing your rentals and transactions more
                      efficiently
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={closeModal}
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold py-6"
              >
                Continue
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Questions? Contact our support team
              </p>
            </div>
          </Card>
        )}

        {verificationStatus === "error" && (
          <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-8 space-y-6 shadow-lg">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-in fade-in scale-in duration-500">
                  <svg
                    className="w-8 h-8 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-red-900 dark:text-red-100">
                  Verification Failed
                </h1>
                <p className="text-red-800 dark:text-red-200">
                  {verificationMessage}
                </p>
              </div>

              <div className="bg-white dark:bg-black/20 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-foreground mb-2">
                  What you can do:
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>
                      Check that the link hasn't expired (links expire after 24
                      hours)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Request a new verification email from the app</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Contact our support team for assistance</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={closeModal}
                className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-semibold py-6"
              >
                Close
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Need help? Contact our support team
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const featuredCars = cars.slice(0, 3);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const db = useMemo(() => new DatabaseService(supabase), [supabase]);

  useEffect(() => {
    db.getCars().then(setCars).catch(console.error);
  }, [db]);

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

      <HelpSupportModal open={helpModalOpen} onOpenChange={setHelpModalOpen} />

      {/* Suspense boundary wrapping the component that uses useSearchParams */}
      <Suspense fallback={null}>
        <VerificationModal />
      </Suspense>

      <Footer />
    </div>
  );
}
