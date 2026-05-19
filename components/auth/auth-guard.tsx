"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

const publicRoutes = [
  "/",
  "/about",
  "/gallery",
  "/contact",
  "/auth/login",
  "/auth/forgot-password",
  "/auth/update-password",
  "/auth/register",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/cars",
  "/cars/[slug]",
  "/cars/category/[slug]",
  "/api/mpesa/stkpush",
  "/api/mpesa/callback",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isPublicRoute = publicRoutes.some((route) => {
    const regexPattern = route
      .replace(/\//g, "\\/")
      .replace(/\[.*?\]/g, "[^/]+");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  });

  useEffect(() => {
    if (!loading && !isPublicRoute && !user) {
      // Redirect to login with returnUrl
      const loginUrl = `/auth/login?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [loading, isPublicRoute, user, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  // If not authenticated and not public, show loading while redirecting
  if (!isPublicRoute && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  return <>{children}</>;
}
