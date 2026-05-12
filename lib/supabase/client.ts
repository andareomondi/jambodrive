import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      auth: {
        persistSession: true, // Store session in localStorage
        autoRefreshToken: true, // Auto-refresh before expiry
        detectSessionInUrl: true, // Handle OAuth callbacks
        storageKey: "cosmara-auth", // Custom storage key
        flowType: "pkce", // More secure flow
      },
    },
  );

  return client;
}
