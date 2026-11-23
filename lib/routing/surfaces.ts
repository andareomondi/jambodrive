/**
 * Surfaces are the public entry points of the app. The main site lives on the
 * root domain; staff and gallery tools live on subdomains of it.
 *
 *   cosmara.co.ke            -> main
 *   gallery.cosmara.co.ke    -> gallery   (internally served from /gallery)
 *   admin.cosmara.co.ke      -> admin     (internally served from /dashboard/admin)
 *   facilitator.cosmara.co.ke-> facilitator (internally served from /dashboard/facilitator)
 *
 * In development, the root is localhost:3000 and subdomains use the
 * `*.localhost` form, which modern browsers resolve to 127.0.0.1.
 */

export type Surface = "main" | "gallery" | "admin" | "facilitator";
type SubSurface = Exclude<Surface, "main">;

const RAW_ROOT = "cosmara.co.ke";
export const ROOT_HOST = RAW_ROOT.split(":")[0];
export const IS_LOCAL_ROOT = ROOT_HOST === "localhost";
const PROTOCOL = IS_LOCAL_ROOT ? "http" : "https";

/** Cookies are shared across subdomains only when scoped to the root domain. */
export const COOKIE_DOMAIN = IS_LOCAL_ROOT ? undefined : `.${ROOT_HOST}`;

export const SURFACE_PREFIX: Record<SubSurface, string> = {
  gallery: "/gallery",
  admin: "/dashboard/admin",
  facilitator: "/dashboard/facilitator",
};

const SUBDOMAIN_LABEL: Record<SubSurface, string> = {
  gallery: "gallery",
  admin: "admin",
  facilitator: "facilitator",
};

export function surfaceOrigin(surface: Surface): string {
  if (surface === "main") return `${PROTOCOL}://${RAW_ROOT}`;
  return `${PROTOCOL}://${SUBDOMAIN_LABEL[surface]}.${RAW_ROOT}`;
}

/** Absolute URL to a path on a surface, e.g. surfaceUrl("admin", "/") */
export function surfaceUrl(surface: Surface, path = "/"): string {
  return `${surfaceOrigin(surface)}${path === "/" ? "" : path}` || "/";
}

/** Works out which surface a request host belongs to. */
export function surfaceFromHost(host: string | null | undefined): Surface {
  const hostname = (host ?? "").split(":")[0].toLowerCase();
  for (const surface of Object.keys(SUBDOMAIN_LABEL) as SubSurface[]) {
    if (hostname === `${SUBDOMAIN_LABEL[surface]}.${ROOT_HOST}`) return surface;
  }
  return "main";
}

/** True when a path is one of the internal paths that subdomains serve. */
export function internalSurfaceForPath(pathname: string): SubSurface | null {
  for (const surface of Object.keys(SURFACE_PREFIX) as SubSurface[]) {
    const prefix = SURFACE_PREFIX[surface];
    if (pathname === prefix || pathname.startsWith(`${prefix}/`))
      return surface;
  }
  return null;
}
