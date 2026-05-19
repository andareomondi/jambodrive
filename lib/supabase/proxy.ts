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

export async function updateSession(request: NextRequest) {
  // Create an initial response object
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Initialize the Server-Side Client for Cookie Synchronization
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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. CRITICAL: Refreshes token automatically if expired (Required for Server Components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 3. Match against static public paths or dynamic paths like /cars/[slug]
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/cars/");

  // 4. Perform instant Server-Side redirection if unauthenticated on private layouts
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
