"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";


const CAR_TYPES = [
  { id: "compact",   name: "Compact"    },
  { id: "economy",   name: "Economy"    },
  { id: "executive", name: "Executive"  },
  { id: "suv",       name: "SUV"        },
  { id: "ssuv",      name: "Luxury SUV" },
  { id: "vans",      name: "Vans"       },
  { id: "safari",    name: "Safari"     },
  { id: "wedding",   name: "Wedding"    },
] as const;

const NAV_LINKS = [
  { href: "/",       label: "Home"       },
  { href: "/cars",   label: "Browse All" },
  { href: "/contact",label: "Contact Us" },
] as const;


interface NavbarProps {
  initialUser: User | null;
  initialRole: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Navbar({ initialUser, initialRole }: NavbarProps) {
  const [user, setUser]   = useState<User | null>(initialUser);
  const [role, setRole]   = useState<string | null>(initialRole);
  const [isOpen, setIsOpen]           = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [scrolled, setScrolled]       = useState(false);

  const fleetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
      }
    );

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
  };

  const isLoggedIn = !!user;

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
              alt="Cozy Mobility Tours Logo"
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
            </Link>           <Link
              href="/contact"
              className="text-sm text-foreground hover:text-accent transition-colors"
            >
              Contact Us
            </Link>

            <a
              href="tel:+254758500943"
              className="text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              +254 758 500943
            </a>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2 w-[180px] justify-end">
            {isLoggedIn ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Profile</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={handleLogout}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Link href="/auth/sign-up">Sign Up</Link>
                </Button>
              </>
            )}
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

                <a
                  href="tel:+254758500943"
                  className="px-3 py-3 text-sm text-foreground hover:text-accent transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  +254 758 500943
                </a>
              </div>
            </div>

            {/* Mobile auth */}
            <div className="mt-3 pt-3 border-t border-border flex gap-2 px-1">
              {isLoggedIn ? (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard" onClick={closeAll}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/auth/login" onClick={closeAll}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Link href="/auth/sign-up" onClick={closeAll}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
