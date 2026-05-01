"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

const carTypes = [
  { id: "compact", name: "Compact" },
  { id: "executive", name: "Executive" },
  { id: "suv", name: "SUV" },
  { id: "ssuv", name: "Luxury SUV" },
  { id: "vans", name: "Vans" },
  { id: "safari", name: "Safari" },
  { id: "wedding", name: "Wedding" },
];

export function Navbar() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const fleetRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change / resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Subtle scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close fleet dropdown on outside click
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
    try {
      await signOut();
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

  const isLoggedIn = !loading && !!user;
  const showAdmin = !loading && isAdmin && !!user;

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 bg-background border-b border-border transition-shadow duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeAll}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
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

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-foreground hover:text-accent transition-colors font-medium text-sm"
            >
              Home
            </Link>

            {/* Fleet Dropdown */}
            <div
              ref={fleetRef}
              className="relative"
              onMouseEnter={() => setIsFleetOpen(true)}
              onMouseLeave={() => setIsFleetOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-foreground hover:text-accent transition-colors font-medium text-sm py-4"
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
                <div className="absolute top-full left-0 w-52 bg-background border border-border shadow-xl rounded-b-lg py-2 animate-in fade-in slide-in-from-top-1">
                  {carTypes.map((type) => (
                    <Link
                      key={type.id}
                      href={`/cars/category/${type.id}`}
                      className="block px-4 py-2.5 text-sm hover:bg-secondary hover:text-accent transition-colors"
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
              className="text-foreground hover:text-accent transition-colors font-medium text-sm"
            >
              Browse All
            </Link>

            {/* Admin link — hidden while loading to avoid flicker, not conditionally mounted */}
            <Link
              href="/dashboard/admin"
              className={cn(
                "text-foreground hover:text-accent transition-colors font-medium text-sm",
                !showAdmin && "hidden",
              )}
            >
              Super Admin
            </Link>
          </div>

          {/* Desktop Auth — fixed width so layout never shifts */}
          <div className="hidden md:flex items-center gap-3 w-[180px] justify-end">
            {loading ? (
              // Skeleton placeholder — same width, no layout shift
              <div className="flex gap-3 w-full justify-end">
                <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
                <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
              </div>
            ) : isLoggedIn ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Profile</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={handleLogout}
                  className="bg-accent hover:bg-accent/90"
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
                  className="bg-accent hover:bg-accent/90"
                >
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden p-2 hover:bg-secondary rounded-md transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-6 border-t border-border bg-background">
            <div className="flex flex-col pt-4 gap-1">
              <Link
                href="/"
                onClick={closeAll}
                className="px-3 py-3 text-foreground hover:bg-secondary rounded-md text-sm"
              >
                Home
              </Link>

              {/* Fleet section */}
              <div className="flex flex-col">
                <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-t border-border mt-2">
                  Our Fleet
                </div>
                <div className="grid grid-cols-2 gap-1 px-2">
                  {carTypes.map((type) => (
                    <Link
                      key={type.id}
                      href={`/cars/category/${type.id}`}
                      onClick={closeAll}
                      className="px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md"
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/cars"
                onClick={closeAll}
                className="px-3 py-3 text-foreground hover:bg-secondary rounded-md border-t border-border mt-2 text-sm"
              >
                Browse All Cars
              </Link>

              {showAdmin && (
                <Link
                  href="/dashboard/admin"
                  onClick={closeAll}
                  className="px-3 py-3 text-foreground hover:bg-secondary rounded-md text-sm"
                >
                  Super Admin
                </Link>
              )}
            </div>

            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-border flex gap-2 px-1">
              {loading ? (
                <>
                  <div className="flex-1 h-9 rounded-md bg-muted animate-pulse" />
                  <div className="flex-1 h-9 rounded-md bg-muted animate-pulse" />
                </>
              ) : isLoggedIn ? (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard" onClick={closeAll}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90"
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
                    className="flex-1 bg-accent hover:bg-accent/90"
                  >
                    <Link href="/auth/register" onClick={closeAll}>
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
