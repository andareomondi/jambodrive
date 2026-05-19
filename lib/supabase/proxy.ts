import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  "/api/mpesa/stkpush",
  "/api/mpesa/callback", // base path — see startsWith check below
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    // Exact-match static public paths
    publicRoutes.some((route) => pathname === route) ||
    // Dynamic public prefixes — use startsWith for paths with segments after them
    pathname.startsWith("/cars/") ||
    // M-Pesa API routes — callback has a dynamic [secret] segment after it,
    // e.g. /api/mpesa/callback/a3f9bc... which would fail an exact-match check.
    // All /api/mpesa/* paths are hit by Safaricom's servers (no session) so
    // they must be fully excluded from auth checks.
    pathname.startsWith("/api/mpesa/");

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
