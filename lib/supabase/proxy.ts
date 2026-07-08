import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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
  "/cpanel",
];
const PUBLIC_PREFIXES = [
  "/cars/",
  "/api/mpesa/",
  "/_next/",
  "/favicon",
  "/logo",
  "/hero/",
  "/car/",
];
const AUTH_ONLY_ROUTES = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
];
const ROLE_ROUTES: { prefix: string; requiredRole: string }[] = [
  { prefix: "/admin", requiredRole: "super_admin" },
  { prefix: "/facilitator", requiredRole: "facilitator" },
];
function isPublic(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  );
}
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (user && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  const matchedRole = ROLE_ROUTES.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );
  if (user && matchedRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const userRole = profile?.role ?? "customer";
    const { requiredRole, prefix } = matchedRole;
    const hasAccess = userRole === "super_admin" || userRole === requiredRole;
    if (!hasAccess) {
      const fallback =
        userRole === "facilitator" ? "/facilitator" : "/dashboard";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }
  return supabaseResponse;
}
