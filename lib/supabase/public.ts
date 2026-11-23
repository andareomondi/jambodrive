import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | undefined;

/**
 * Anonymous, cookie-free client for public reads (fleet, gallery). Because it
 * never touches request cookies, pages that use it can be cached and
 * revalidated instead of rendered on every request. Row-level security still
 * decides what it can read.
 */
export function createPublicClient(): SupabaseClient {
  if (!publicClient) {
    publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return publicClient;
}
