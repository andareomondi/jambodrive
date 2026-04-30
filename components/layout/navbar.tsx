"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isFleetOpen, setIsFleetOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const carTypes = [
    { id: "compact", name: "Compact" },
    { id: "executive", name: "Executive" },
    { id: "suv", name: "SUV" },
    { id: "ssuv", name: "Luxury SUV" },
    { id: "vans", name: "Vans" },
    { id: "safari", name: "Safari" },
    { id: "wedding", name: "Wedding" },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully!");
    } catch {
      toast.error("Error logging out. Please try again.");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.ico"
              alt="Cozy Mobility Logo"
              width={32}
              height={32}
              className="rounded-sm"
            />
            <span className="font-bold text-xl text-foreground">
              Cosmara
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-foreground hover:text-accent transition-colors font-medium"
            >
              Home
            </Link>

            {/* Fleet Dropdown (Desktop) */}
            <div
              className="relative group"
              onMouseEnter={() => setIsFleetOpen(true)}
              onMouseLeave={() => setIsFleetOpen(false)}
            >
              <button className="flex items-center gap-1 text-foreground hover:text-accent transition-colors font-medium py-4">
                Fleet{" "}
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
                      onClick={() => setIsFleetOpen(false)}
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/cars"
              className="text-foreground hover:text-accent transition-colors font-medium"
            >
              Browse All
            </Link>
            {!loading && isAdmin && user && (
              <Link
                href="/dashboard/admin"
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                Super Admin
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex gap-3 min-w-[168px] justify-end">
            {!loading &&
              (user ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Profile</Link>
                  </Button>
                  <Button
                    onClick={handleLogout}
                    className="bg-accent hover:bg-accent/90"
                  >
                    LogOut
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-accent hover:bg-accent/90">
                    <Link href="/auth/register">Sign Up</Link>
                  </Button>
                </>
              ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-secondary rounded-md transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-6 border-t border-border bg-background">
            <div className="flex flex-col pt-4">
              <Link
                href="/"
                onClick={toggleMenu}
                className="px-3 py-3 text-foreground hover:bg-secondary rounded-md"
              >
                Home
              </Link>

              {/* Fleet Section (Mobile) */}
              <div className="flex flex-col">
                <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-t border-border mt-2">
                  Our Fleet
                </div>
                <div className="grid grid-cols-2 gap-1 px-2">
                  {carTypes.map((type) => (
                    <Link
                      key={type.id}
                      href={`/cars/category/${type.id}`}
                      onClick={toggleMenu}
                      className="px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md"
                    >
                      {type.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/cars"
                onClick={toggleMenu}
                className="px-3 py-3 text-foreground hover:bg-secondary rounded-md border-t border-border mt-2"
              >
                Browse All Cars
              </Link>

              {!loading && isAdmin && user && (
                <Link
                  href="/dashboard/admin"
                  onClick={toggleMenu}
                  className="px-3 py-3 text-foreground hover:bg-secondary rounded-md"
                >
                  Super Admin
                </Link>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              {user ? (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard" onClick={toggleMenu}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    className="flex-1 bg-accent"
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                  >
                    LogOut
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/auth/login" onClick={toggleMenu}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="flex-1 bg-accent">
                    <Link href="/auth/register" onClick={toggleMenu}>
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
