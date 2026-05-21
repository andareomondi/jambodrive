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
  "/api/mpesa/callback",
];

// Routes only accessible when NOT authenticated
// (logged-in users are bounced away from these)
const authOnlyRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/forgot-password",
];

// Role-gated routes — middleware fetches the profile role to enforce these
const roleRoutes: { prefix: string; requiredRole: string }[] = [
  { prefix: "/admin", requiredRole: "admin" },
  { prefix: "/facilitator", requiredRole: "facilitator" },
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
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
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/cars/") ||
    pathname.startsWith("/api/mpesa/");

  // ── 1. Unauthenticated → redirect to login ──────────────────────────────
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Authenticated → bounce away from auth-only pages ─────────────────
  if (user && authOnlyRoutes.some((route) => pathname === route)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── 3. Role-gated routes ─────────────────────────────────────────────────
  const matchedRoleRoute = roleRoutes.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (user && matchedRoleRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role ?? "customer";
    const { requiredRole } = matchedRoleRoute;

    // Admins can access everything, including facilitator routes
    const hasAccess = userRole === "admin" || userRole === requiredRole;

    if (!hasAccess) {
      // Send them somewhere appropriate instead of a blank 403
      const fallback = userRole === "facilitator" ? "/facilitator" : "/";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  return supabaseResponse;
}
