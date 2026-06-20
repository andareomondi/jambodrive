import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Route definitions ─────────────────────────────────────────────────────────

// Accessible without a session
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/gallery",
  "/contact",
  "/cars",
  "/auth/login",
  "/auth/sign-up",
  "/auth/sign-up-success",
  "/auth/forgot-password",
  "/auth/update-password",
  "/auth/confirm",
  "/auth/error",
  "/terms",
  "/faq",
];

const PUBLIC_PREFIXES = [
  "/cars/", // individual car pages + categories
  "/api/mpesa/", // Safaricom callbacks must never be auth-blocked
  "/_next/",
  "/favicon",
  "/logo",
  "/hero/",
  "/car/",
];

// Redirect logged-in users away from these (no point showing login to an authed user)
const AUTH_ONLY_ROUTES = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
];

// Role-gated route prefixes — profile DB check only runs when matched
const ROLE_ROUTES: { prefix: string; requiredRole: string }[] = [
  { prefix: "/admin", requiredRole: "super_admin" },
  { prefix: "/facilitator", requiredRole: "facilitator" },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  );
}

// ── Main middleware function ───────────────────────────────────────────────────

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Always create a fresh client per request — never use a global.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() contacts the Auth server — correctly detects signout immediately.
  // getClaims() only reads the local JWT and won't detect signout until token expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── 1. Unauthenticated → redirect to login ──────────────────────────────────
  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Authenticated → bounce away from auth-only pages ────────────────────
  if (user && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── 3. Role-gated routes ────────────────────────────────────────────────────
  const matchedRole = ROLE_ROUTES.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (user && matchedRole) {
    // Only hit the DB when we actually need the role — not on every request
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role ?? "customer";
    const { requiredRole, prefix } = matchedRole;

    // super_admin can access everything including facilitator routes
    const hasAccess = userRole === "super_admin" || userRole === requiredRole;

    if (!hasAccess) {
      const fallback =
        userRole === "facilitator" ? "/facilitator" : "/dashboard";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  // IMPORTANT: return supabaseResponse as-is to keep cookies in sync.
  return supabaseResponse;
}
