"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation";

// Define the shape of our context
interface SupabaseContextType {
  supabase: ReturnType<typeof createBrowserClient>;
}

const Context = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 1. CRITICAL FIX: Instantiate the browser client exactly ONCE per user session.
  // This solves your flickering and isolated state bugs by providing a single source of truth.
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    )
  );

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track user activity timestamps
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Listen to user interactions to track active presence
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Handle authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Tells Next.js to re-fetch Server Components data without resetting state
        router.refresh(); 
      }

      if (event === "SIGNED_OUT") {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        router.push("/auth/login");
      }
    });

    // Start Supabase's internal token manager
    supabase.auth.startAutoRefresh();

    // Aggressive session refresh loop (Every 30 seconds)
    refreshIntervalRef.current = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const expiresAt = session.expires_at! * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        const isAdminPage = pathname.startsWith("/admin");
        // Force refresh if token expires in under 10 minutes OR user is viewing admin dashboards
        const shouldRefresh = timeUntilExpiry < 10 * 60 * 1000 || isAdminPage;

        if (shouldRefresh) {
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error("❌ Refresh failed:", error.message);
          }
        }
      }
    }, 30000);

    // Handle internet recovery
    const handleOnline = async () => {
      console.log("🌐 Network reconnected, refreshing session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.refreshSession();
        router.refresh();
      }
    };

    // Handle browser tab switching/waking up
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const inactiveTime = Date.now() - lastActivityRef.current;

        // Force token refresh if returning after 5+ minutes of complete silence
        if (inactiveTime > 5 * 60 * 1000) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.refreshSession();
            router.refresh();
          }
        }
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up event listeners and intervals on unmount
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

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  );
}

// Custom hook to consume the single client instance in pages/components
export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};

