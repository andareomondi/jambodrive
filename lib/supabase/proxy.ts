import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectTarget } from "@/lib/auth/safe-redirect";
import {
  COOKIE_DOMAIN,
  IS_LOCAL_ROOT,
  ROOT_HOST,
  SURFACE_PREFIX,
  internalSurfaceForPath,
  surfaceFromHost,
  surfaceUrl,
  type Surface,
} from "@/lib/routing/surfaces";
import { ADMIN_ROLES, STAFF_ROLES } from "@/lib/auth/roles";
import type { ProfileRole } from "@/types";


/** Paths anyone can open without signing in. Checked against the internal path. */
const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/gallery",
  "/contact",
  "/cars",
  "/faq",
  "/terms",
  "/airport-pickup",
  "/wedding-events",
  "/auth/login",
  "/auth/sign-up",
  "/auth/sign-up-success",
  "/auth/forgot-password",
  "/auth/update-password",
  "/auth/confirm",
  "/auth/error",
]);

const PUBLIC_PREFIXES = ["/cars/", "/api/mpesa/", "/_next/", "/favicon", "/logo", "/hero/", "/car/"];

const AUTH_ONLY_ROUTES = new Set(["/auth/login", "/auth/sign-up", "/auth/forgot-password"]);

/** Which role may open each internal prefix. */
const ROLE_ROUTES: { prefix: string; roles: ProfileRole[] }[] = [
  { prefix: SURFACE_PREFIX.admin, roles: ADMIN_ROLES },
  { prefix: SURFACE_PREFIX.facilitator, roles: STAFF_ROLES },
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function fallbackFor(role: ProfileRole | null): string {
  if (role === "facilitator") return surfaceUrl("facilitator", "/");
  return surfaceUrl("main", "/dashboard");
}

export async function updateSession(request: NextRequest) {
  const surface: Surface = surfaceFromHost(request.headers.get("host"));
  const search = request.nextUrl.search;
  const cleanPath = request.nextUrl.pathname;

  // Old main-domain paths move to their subdomain in production.
  if (surface === "main" && !IS_LOCAL_ROOT) {
    const moved = internalSurfaceForPath(cleanPath);
    if (moved) {
      const suffix = cleanPath.slice(SURFACE_PREFIX[moved].length) || "/";
      return NextResponse.redirect(surfaceUrl(moved, `${suffix}${search}`), 301);
    }
  }

  // On a subdomain, the public path is served from its internal prefix.
  let internalPath = cleanPath;
  let rewriteTo: string | null = null;
  if (surface !== "main") {
    // Assets and API routes are served from the same app on every host.
    if (cleanPath.startsWith("/_next/") || cleanPath.startsWith("/api/") || /\.[a-z0-9]+$/i.test(cleanPath)) {
      return NextResponse.next({ request });
    }
    // Subdomains serve only their own page. Anything else (the navbar links
    // back to the shop, for example) belongs on the main domain.
    if (cleanPath !== "/") {
      if (internalSurfaceForPath(cleanPath) !== null) {
        return NextResponse.redirect(surfaceUrl(surface, `/${search}`), 301);
      }
      return NextResponse.redirect(surfaceUrl("main", `${cleanPath}${search}`), 301);
    }
    internalPath = SURFACE_PREFIX[surface];
    rewriteTo = internalPath;
  }

  const base = rewriteTo
    ? NextResponse.rewrite(new URL(`${rewriteTo}${search}`, request.url), { request })
    : NextResponse.next({ request });

  if (isPublic(internalPath)) return base;

  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") === "1";
  if (isPrefetch) return base;

  const supabaseResponse = base;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN, path: "/" } : undefined,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write every refreshed cookie to the same response. Recreating the
          // response would drop cookies set earlier in this request.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  if (!user) {
    const returnValue = surface === "main" ? `${cleanPath}${search}` : request.nextUrl.href;
    const loginUrl =
      surface === "main"
        ? new URL("/auth/login", request.url)
        : new URL(surfaceUrl("main", "/auth/login"));
    loginUrl.searchParams.set("returnUrl", returnValue);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_ROUTES.has(internalPath)) {
    const target = safeRedirectTarget(
      request.nextUrl.searchParams.get("returnUrl"),
      "/dashboard",
      ROOT_HOST,
    );
    return NextResponse.redirect(
      /^https?:\/\//.test(target) ? target : new URL(target, request.url),
    );
  }

  const matchedRole = ROLE_ROUTES.find(({ prefix }) => internalPath.startsWith(prefix));
  if (matchedRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const userRole = (profile?.role ?? null) as ProfileRole | null;
    const allowed = userRole !== null && matchedRole.roles.includes(userRole);
    if (!allowed) {
      return NextResponse.redirect(fallbackFor(userRole));
    }
  }

  return supabaseResponse;
}
