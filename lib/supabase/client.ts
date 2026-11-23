import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { COOKIE_DOMAIN } from "@/lib/routing/surfaces";

let browserClient: SupabaseClient | undefined;

/**
 * One browser client per page load. Creating a client per component meant
 * several competing auth listeners and token refreshes.
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN, path: "/" } : undefined },
    );
  }
  return browserClient;
}
