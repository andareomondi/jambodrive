import { describe, expect, it } from "vitest";
import { safeLocalRedirect, safeRedirectTarget } from "@/lib/auth/safe-redirect";

describe("safeLocalRedirect", () => {
  it("keeps same-site relative paths", () => {
    expect(safeLocalRedirect("/dashboard?tab=bookings", "/")).toBe("/dashboard?tab=bookings");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeLocalRedirect("//evil.com", "/")).toBe("/");
    expect(safeLocalRedirect("https://evil.com", "/")).toBe("/");
  });

  it("rejects encoded tricks", () => {
    expect(safeLocalRedirect("/%2F%2Fevil.com", "/")).toBe("/");
    expect(safeLocalRedirect("/\\evil.com", "/")).toBe("/");
  });

  it("falls back when empty", () => {
    expect(safeLocalRedirect(null, "/home")).toBe("/home");
  });
});

describe("safeRedirectTarget", () => {
  const root = "cosmara.co.ke";

  it("allows absolute URLs on the root domain and its subdomains", () => {
    expect(safeRedirectTarget("https://admin.cosmara.co.ke/", "/", root)).toBe(
      "https://admin.cosmara.co.ke/",
    );
    expect(safeRedirectTarget("https://cosmara.co.ke/dashboard", "/", root)).toBe(
      "https://cosmara.co.ke/dashboard",
    );
  });

  it("rejects look-alike and foreign domains", () => {
    expect(safeRedirectTarget("https://cosmara.co.ke.evil.com/", "/", root)).toBe("/");
    expect(safeRedirectTarget("https://evilcosmara.co.ke/", "/", root)).toBe("/");
    expect(safeRedirectTarget("https://example.com/", "/", root)).toBe("/");
  });

  it("still validates relative paths", () => {
    expect(safeRedirectTarget("//evil.com", "/", root)).toBe("/");
  });
});
