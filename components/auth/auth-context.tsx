"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen to user interactions
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED") {
        router.refresh();
      }

      if (event === "SIGNED_IN") {
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        router.push("/auth/login");
      }

      if (event === "USER_UPDATED") {
        router.refresh();
      }
    });

    // Start automatic token refresh
    supabase.auth.startAutoRefresh();

    // Aggressive session refresh for admin pages
    // Check every 30 seconds if on admin/protected routes
    refreshIntervalRef.current = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const expiresAt = session.expires_at! * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Refresh if less than 10 minutes remaining OR if on admin page
        const isAdminPage = pathname.startsWith("/admin");
        const shouldRefresh = timeUntilExpiry < 10 * 60 * 1000 || isAdminPage;

        if (shouldRefresh) {
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("❌ Refresh failed:", error.message);
          }
        }
      }
    }, 30000); // Check every 30 seconds

    // Handle network reconnection
    const handleOnline = async () => {
      console.log("🌐 Network reconnected, refreshing session...");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.refreshSession();
        router.refresh();
      }
    };

    // Handle page visibility (when user returns to tab)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const inactiveTime = Date.now() - lastActivityRef.current;

        // If inactive for more than 5 minutes, refresh session
        if (inactiveTime > 5 * 60 * 1000) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.refreshSession();
            router.refresh();
          }
        }
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      supabase.auth.stopAutoRefresh();

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase, router, pathname]);

  return <>{children}</>;
}
