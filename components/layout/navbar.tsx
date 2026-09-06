"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ChevronDown,
  CarFront,
  UserCheck,
  Map as MapIcon,
  Plane,
  Building,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

const CAR_TYPES = [
  { id: "compact", name: "Compact" },
  { id: "economy", name: "Economy" },
  { id: "executive", name: "Executive" },
  { id: "suv", name: "SUV" },
  { id: "ssuv", name: "Luxury SUV" },
  { id: "vans", name: "Vans" },
  { id: "trucks", name: "Trucks" },
] as const;

interface NavbarProps {
  initialUser: User | null;
  initialRole: string | null;
}

export function Navbar({ initialUser, initialRole }: NavbarProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [role, setRole] = useState<string | null>(initialRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const fleetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        setRole(data?.role ?? "customer");
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fleet dropdown click-outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fleetRef.current && !fleetRef.current.contains(e.target as Node)) {
        setIsFleetOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setIsOpen(false);
      toast.success("Logged out successfully!");
    } catch {
      toast.error("Error logging out. Please try again.");
    }
  };

  const closeAll = () => {
    setIsOpen(false);
    setIsFleetOpen(false);
    setIsBookModalOpen(false);
  };

  const isLoggedIn = !!user;

  // Booking Services Array
  const BOOKING_SERVICES = [
    {
      href: "/cars?service=self-chauffeured",
      title: "Self-Chauffeured",
      desc: "Drive yourself at your own pace",
      icon: CarFront,
      comingSoon: false,
    },
    {
      href: "/cars?service=chauffeured",
      title: "Chauffeured",
      desc: "Sit back and let our experts drive",
      icon: UserCheck,
      comingSoon: false,
    },
    {
      href: "#",
      title: "Tours",
      desc: "Explore amazing destinations",
      icon: MapIcon,
      comingSoon: true,
    },
    {
      href: "#",
      title: "Airport Pickups",
      desc: "Seamless airport transfers",
      icon: Plane,
      comingSoon: true,
    },
    {
      href: "#",
      title: "Hotel Bookings",
      desc: "Comfortable stays guaranteed",
      icon: Building,
      comingSoon: true,
    },
    {
      href: "#",
      title: "Wedding Events",
      desc: "Make your special day perfect",
      icon: PartyPopper,
      comingSoon: true,
    },
  ];

  const handleServiceClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    service: typeof BOOKING_SERVICES[0]
  ) => {
    if (service.comingSoon) {
      e.preventDefault();
      toast.info(`${service.title} are still under development and coming soon!`);
    } else {
      closeAll();
    }
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 bg-background/95 border-b border-border backdrop-blur-sm transition-shadow duration-200",
        scrolled && "shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeAll}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <Image
              src="/logo.ico"
              alt="Cosmara Logo"
              width={32}
              height={32}
              className="rounded-sm"
            />
            <span className="font-bold text-xl text-foreground">Cosmara</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              href="/"
              className="text-sm text-foreground hover:text-accent transition-colors"
            >
              Home
            </Link>
            {/* Fleet dropdown */}
            <div
              ref={fleetRef}
              className="relative"
              onMouseEnter={() => setIsFleetOpen(true)}
              onMouseLeave={() => setIsFleetOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-sm text-foreground hover:text-accent transition-colors py-4"
                onClick={() => setIsFleetOpen((v) => !v)}
                aria-expanded={isFleetOpen}
                aria-haspopup="true"
              >
                Fleet
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isFleetOpen && "rotate-180"
                  )}
                />
              </button>

              {isFleetOpen && (
                <div className="absolute top-full left-0 w-52 bg-background border border-border shadow-lg rounded-b-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {CAR_TYPES.map((type) => (
                    <Link
                      key={type.id}
                      href={`/cars/category/${type.id}`}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-secondary hover:text-accent transition-colors"
                      onClick={closeAll}
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/cars"
              className="text-sm text-foreground hover:text-accent transition-colors"
            >
              Browse All
            </Link>
            {role === "super_admin" && (
              <Link
                href="/dashboard/admin"
                className="text-sm text-foreground hover:text-accent transition-colors"
              >
                Admin
              </Link>
            )}
            {role === "facilitator" && (
              <Link
                href="/dashboard/facilitator"
                className="text-sm text-foreground hover:text-accent transition-colors"
              >
                Facilitator
              </Link>
            )}
            <Link
              href="/gallery"
              className="text-sm text-foreground hover:text-accent transition-colors"
            >
              Gallery
            </Link>
            <Link
              href="/contact"
              className="text-sm text-foreground hover:text-accent transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Desktop auth & CTA */}
          <div className="hidden md:flex items-center gap-2 justify-end">
            {isLoggedIn ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Profile</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsBookModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground ml-2"
            >
              Book Now
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border bg-background pb-6">
            <div className="flex flex-col pt-3 gap-0.5">
              <Link
                href="/"
                onClick={closeAll}
                className="px-3 py-3 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
              >
                Home
              </Link>

              {/* Fleet section */}
              <div className="mt-2 pt-2 border-t border-border">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Our Fleet
                </p>
                <div className="grid grid-cols-2 gap-0.5 px-1">
                  {CAR_TYPES.map((type) => (
                    <Link
                      key={type.id}
                      href={`/cars/category/${type.id}`}
                      onClick={closeAll}
                      className="px-3 py-2.5 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border flex flex-col gap-0.5">
                <Link
                  href="/cars"
                  onClick={closeAll}
                  className="px-3 py-3 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  Browse All Cars
                </Link>

                {role === "super_admin" && (
                  <Link
                    href="/dashboard/admin"
                    onClick={closeAll}
                    className="px-3 py-3 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {role === "facilitator" && (
                  <Link
                    href="/dashboard/facilitator"
                    onClick={closeAll}
                    className="px-3 py-3 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                  >
                    Facilitator
                  </Link>
                )}
                <Link
                  href="/gallery"
                  onClick={closeAll}
                  className="px-3 py-3 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  Gallery
                </Link>
                <Link
                  href="/contact"
                  onClick={closeAll}
                  className="px-3 py-3 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Mobile auth & CTA */}
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2 px-3">
              {isLoggedIn ? (
                <div className="flex gap-2">
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard" onClick={closeAll}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/login" onClick={closeAll}>
                    Sign In
                  </Link>
                </Button>
              )}
              <Button
                onClick={() => {
                  setIsOpen(false);
                  setIsBookModalOpen(true);
                }}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-2"
              >
                Book Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Book Now Modal */}
      <Dialog.Root open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 md:p-8 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <div className="mb-8 text-center md:text-left">
              <Dialog.Title className="text-2xl md:text-3xl font-bold text-foreground">
                What are you looking for?
              </Dialog.Title>
              <Dialog.Description className="text-sm md:text-base text-muted-foreground mt-2">
                Select a service below to proceed with your booking.
              </Dialog.Description>
            </div>

            {/* Mini Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {BOOKING_SERVICES.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={(e) => handleServiceClick(e, item)}
                  className="group flex flex-col items-center text-center p-5 rounded-xl border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all relative overflow-hidden"
                >
                  <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                    <item.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm md:text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 hidden md:block">
                    {item.desc}
                  </p>
                  
                  {/* Subtle coming soon indicator badge */}
                  {item.comingSoon && (
                    <div className="absolute top-2 right-2 bg-muted/80 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-semibold">
                      Soon
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </nav>
  );
}
