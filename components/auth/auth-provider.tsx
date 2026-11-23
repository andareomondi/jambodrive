"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Single place that reacts to auth changes across the whole app. Refreshes
 * server components on sign-in/out and token refresh, and sends a signed-out
 * user on a protected page back to login.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/login");
        router.refresh();
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return <>{children}</>;
}
