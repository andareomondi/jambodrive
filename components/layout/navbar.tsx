"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-context";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

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
            <span className="font-bold text-xl sm:inline text-foreground">
              Cozy Mobility
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
            <Link
              href="/cars"
              className="text-foreground hover:text-accent transition-colors font-medium"
            >
              Browse Cars
            </Link>
            {isAdmin && user && (
              <Link
                href="/dashboard/admin"
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                Super Admin
              </Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex gap-3">
            {user ? (
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
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 hover:bg-secondary rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-3 pt-4 text-center">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-foreground hover:bg-secondary rounded-md transition-colors"
              >
                Home
              </Link>
              <Link
                href="/cars"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-foreground hover:bg-secondary rounded-md transition-colors"
              >
                Browse Cars
              </Link>
              {isAdmin && user && (
                <Link
                  href="/dashboard/admin"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  Super Admin
                </Link>
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-border flex gap-2">
              {user ? (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/dashboard">Profile</Link>
                  </Button>
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90"
                    onClick={handleLogout}
                  >
                    LogOut
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-accent hover:bg-accent/90"
                  >
                    <Link href="/auth/register">Sign Up</Link>
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
