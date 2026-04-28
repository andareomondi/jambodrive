"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LogIn } from "lucide-react";
import Link from "next/link";

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/auth/login",
  "/auth/register",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/cars",
  "/cars/[slug]",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.some((route) => {
    const regexPattern = route
      .replace(/\//g, "\\/")
      .replace(/\[.*?\]/g, "[^/]+");
    return new RegExp(`^${regexPattern}$`).test(pathname);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!isPublicRoute && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access this page. Please sign in to
              continue.
            </p>
            <div className="space-y-3">
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/register">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
