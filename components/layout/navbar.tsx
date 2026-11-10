"use client";

import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
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

// Moved outside the component to prevent re-creation on every render
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
    href: "/airport-pickup",
    title: "Airport Pickups",
    desc: "Seamless airport transfers",
    icon: Plane,
    comingSoon: false,
  },
  {
    href: "#",
    title: "Hotel Bookings",
    desc: "Comfortable stays guaranteed",
    icon: Building,
    comingSoon: true,
  },
  {
    href: "/wedding-events",
    title: "Wedding Events",
    desc: "Make your special day perfect",
    icon: PartyPopper,
    comingSoon: false,
  },
] as const;

interface NavbarProps {
  initialUser: User | null;
  initialRole: string | null;
}

export function Navbar({ initialUser, initialRole }: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser);
  const [role, setRole] = useState<string | null>(initialRole);
  const [isOpen, setIsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const fleetRef = useRef<HTMLDivElement>(null);

  // Optimized Supabase auth listener with caching profile fetch guard
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Prevent redundant state updates if the user session hasn't changed
      const currentUser = session?.user ?? null;

      setUser((prevUser) => {
        if (prevUser?.id === currentUser?.id) return prevUser;
        return currentUser;
      });

      if (currentUser) {
        // Only fetch profile if role isn't already synced or user changed
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll shadow with passive listener optimization
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
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

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setIsOpen(false);
      toast.success("Logged out successfully!");
    } catch {
      toast.error("Error logging out. Please try again.");
    }
  }, []);

  const closeAll = useCallback(() => {
    setIsOpen(false);
    setIsFleetOpen(false);
    setIsBookModalOpen(false);
  }, []);

  const isLoggedIn = useMemo(() => !!user, [user]);
  const isHomePage = pathname === "/";
  const heroOverlay = isHomePage && !scrolled;
  const desktopNavLinkClass = cn(
    "font-display rounded-full px-3.5 py-2 text-lg font-semibold tracking-wide text-foreground/85 transition-colors duration-200 hover:bg-white/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
    heroOverlay && "text-white/90 hover:bg-white/10 hover:text-white",
  );

  const handleServiceClick = useCallback(
    (
      e: React.MouseEvent<HTMLAnchorElement>,
      service: (typeof BOOKING_SERVICES)[number],
    ) => {
      if (service.comingSoon) {
        e.preventDefault();
        toast.info(
          `${service.title} are still under development and coming soon!`,
        );
      } else {
        closeAll();
      }
    },
    [closeAll],
  );

  return (
    <nav
      className={cn(
        "left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300",
        isHomePage
          ? scrolled
            ? "fixed top-0 border-border/80 bg-background/85 shadow-lg shadow-black/10"
            : "absolute top-0 border-transparent bg-transparent shadow-none backdrop-blur-none"
          : cn(
              "sticky top-0",
              scrolled
                ? "border-border/80 bg-background/90 shadow-lg shadow-black/10"
                : "border-border/70 bg-background/85 shadow-sm shadow-black/5",
            ),
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeAll}
            className="group flex shrink-0 items-center gap-3 rounded-full pr-3 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <AppImage
              src="/logo.ico"
              alt="Cosmara Logo"
              width={38}
              height={38}
              className="rounded-full ring-1 ring-white/15"
              priority
            />
            <span
              className={cn(
                "font-display text-2xl font-semibold tracking-wide text-foreground sm:text-[1.75rem]",
                heroOverlay && "text-white",
              )}
            >
              Cosmara
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={desktopNavLinkClass}
            >
              Home
            </Link>
            {/* Fleet dropdown */}
            {/* Commenting out this fleet section */}
            {/*
            <div
              ref={fleetRef}
              className="relative"
              onMouseEnter={() => setIsFleetOpen(true)}
              onMouseLeave={() => setIsFleetOpen(false)}
            >
              <button
                className={cn(
                  "font-display flex items-center gap-1.5 rounded-full px-3.5 py-2 text-lg font-semibold tracking-wide text-foreground/85 transition-colors duration-200 hover:bg-white/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  heroOverlay && "text-white/90 hover:bg-white/10 hover:text-white",
                )}
                onClick={() => setIsFleetOpen((v) => !v)}
                aria-expanded={isFleetOpen}
                aria-haspopup="true"
              >
                Fleet
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isFleetOpen && "rotate-180",
                  )}
                />
              </button>

              {isFleetOpen && (
                <div className="absolute left-0 top-full w-56 overflow-hidden rounded-2xl border border-border/80 bg-background/95 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
                  {CAR_TYPES.map((type) => (
                    <Link
                      key={type.id}
                      href={`/cars/category/${type.id}`}
                      className="font-display block rounded-xl px-3.5 py-2.5 text-lg font-medium text-foreground/85 transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      onClick={closeAll}
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            */}
            <Link
              href="/cars"
              className={desktopNavLinkClass}
            >
              Browse All
            </Link>
            {role === "super_admin" && (
              <Link
                href="/dashboard/admin"
                prefetch={false}
                className={desktopNavLinkClass}
              >
                Admin
              </Link>
            )}
            {role === "facilitator" && (
              <Link
                href="/dashboard/facilitator"
                prefetch={false}
                className={desktopNavLinkClass}
              >
                Facilitator
              </Link>
            )}
            <Link
              href="/gallery"
              className={desktopNavLinkClass}
            >
              Gallery
            </Link>
            <Link
              href="/airport-pickup"
              className={desktopNavLinkClass}
            >
              Airport Pickups
            </Link>
            <Link
              href="/wedding-events"
              className={desktopNavLinkClass}
            >
              Wedding Events
            </Link>
          </div>

          {/* Desktop auth & CTA */}
          <div className="hidden lg:flex items-center justify-end gap-2">
            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "rounded-full px-4 font-semibold text-foreground/80 hover:bg-white/8 hover:text-foreground",
                    heroOverlay && "text-white/90 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Link href="/dashboard" prefetch={false}>
                    Profile
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className={cn(
                    "rounded-full px-4 font-semibold text-foreground/80 hover:bg-white/8 hover:text-foreground",
                    heroOverlay && "text-white/90 hover:bg-white/10 hover:text-white",
                  )}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "rounded-full px-4 font-semibold text-foreground/80 hover:bg-white/8 hover:text-foreground",
                  heroOverlay && "text-white/90 hover:bg-white/10 hover:text-white",
                )}
              >
                <Link href="/auth/login" prefetch={false}>
                  Sign In
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsBookModalOpen(true)}
              className="ml-1 h-10 rounded-full bg-accent px-5 font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-accent/30"
            >
              Book Now
              <ArrowUpRight className="ml-0.5 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-background/55 text-foreground shadow-sm backdrop-blur-lg transition-all duration-200 hover:border-accent/50 hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="border-t border-border/70 pb-5 pt-4 lg:hidden">
            <div className="rounded-3xl border border-border/80 bg-background/85 p-3 shadow-2xl shadow-black/15 backdrop-blur-xl">
              <div className="flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={closeAll}
                  className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Home
                </Link>

                {/* Fleet section */}
                {/* Commenting out this part since not need actually */}
                {/*
                <div className="mt-1 border-t border-border/70 pt-3">
                  <p className="px-4 pb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                    Our Fleet
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {CAR_TYPES.map((type) => (
                      <Link
                        key={type.id}
                        href={`/cars/category/${type.id}`}
                        onClick={closeAll}
                        className="font-display rounded-xl px-3.5 py-3 text-lg font-medium text-foreground/85 transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {type.name}
                      </Link>
                    ))}
                  </div>
                </div>
                */}

                <div className="mt-2 flex flex-col gap-1 border-t border-border/70 pt-3">
                  <Link
                    href="/cars"
                    onClick={closeAll}
                    className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Browse All Cars
                  </Link>

                  {role === "super_admin" && (
                    <Link
                      href="/dashboard/admin"
                      prefetch={false}
                      onClick={closeAll}
                      className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Admin
                    </Link>
                  )}

                  {role === "facilitator" && (
                    <Link
                      href="/dashboard/facilitator"
                      prefetch={false}
                      onClick={closeAll}
                      className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Facilitator
                    </Link>
                  )}
                  <Link
                    href="/gallery"
                    onClick={closeAll}
                    className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Gallery
                  </Link>
                  <Link
                    href="/airport-pickup"
                    onClick={closeAll}
                    className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Airport Pickups
                  </Link>
                  <Link
                    href="/wedding-events"
                    onClick={closeAll}
                    className="font-display rounded-2xl px-4 py-3 text-lg font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Wedding Events
                  </Link>
                </div>
              </div>

              {/* Mobile auth & CTA */}
              <div className="mt-3 flex flex-col gap-2 border-t border-border/70 px-1 pt-4">
                {isLoggedIn ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      asChild
                      className="h-11 flex-1 rounded-full font-bold"
                    >
                      <Link
                        href="/dashboard"
                        prefetch={false}
                        onClick={closeAll}
                      >
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 flex-1 rounded-full font-bold"
                      onClick={handleLogout}
                    >
                      Log Out
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    asChild
                    className="h-11 w-full rounded-full font-bold"
                  >
                    <Link href="/auth/login" prefetch={false} onClick={closeAll}>
                      Sign In
                    </Link>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setIsBookModalOpen(true);
                  }}
                  className="mt-1 h-12 w-full rounded-full bg-accent font-extrabold text-accent-foreground shadow-lg shadow-accent/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/90"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Now Modal */}
      <Dialog.Root open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 md:p-8 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            aria-describedby="booking-modal-description"
          >
            <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <div className="mb-8 text-center md:text-left">
              <Dialog.Title className="text-2xl md:text-3xl font-bold text-foreground">
                What are you looking for?
              </Dialog.Title>
              <Dialog.Description
                id="booking-modal-description"
                className="text-sm md:text-base text-muted-foreground mt-2"
              >
                Select a service below to proceed with your booking.
              </Dialog.Description>
            </div>

            {/* Mini Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {BOOKING_SERVICES.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    prefetch={item.comingSoon ? false : undefined}
                    onClick={(e) => handleServiceClick(e, item)}
                    className="group flex flex-col items-center text-center p-5 rounded-xl border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all relative overflow-hidden"
                  >
                    <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-accent/20 transition-all">
                      <IconComponent className="h-7 w-7 text-accent" />
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
                );
              })}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </nav>
  );
}
