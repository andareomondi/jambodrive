import { describe, expect, it } from "vitest";
import {
  internalSurfaceForPath,
  surfaceFromHost,
  surfaceUrl,
} from "@/lib/routing/surfaces";

describe("surfaceFromHost (development root: localhost:3000)", () => {
  it("maps subdomains to their surface", () => {
    expect(surfaceFromHost("admin.localhost:3000")).toBe("admin");
    expect(surfaceFromHost("gallery.localhost:3000")).toBe("gallery");
    expect(surfaceFromHost("facilitator.localhost:3000")).toBe("facilitator");
  });

  it("treats the root and unknown hosts as main", () => {
    expect(surfaceFromHost("localhost:3000")).toBe("main");
    expect(surfaceFromHost("evil.localhost:3000")).toBe("main");
    expect(surfaceFromHost(null)).toBe("main");
  });
});

describe("internalSurfaceForPath", () => {
  it("finds the surface behind an internal prefix", () => {
    expect(internalSurfaceForPath("/dashboard/admin")).toBe("admin");
    expect(internalSurfaceForPath("/dashboard/admin/bookings")).toBe("admin");
    expect(internalSurfaceForPath("/gallery")).toBe("gallery");
  });

  it("does not match lookalike prefixes", () => {
    expect(internalSurfaceForPath("/dashboard/administrator")).toBeNull();
    expect(internalSurfaceForPath("/cars")).toBeNull();
  });
});

describe("surfaceUrl", () => {
  it("builds absolute URLs for each surface", () => {
    expect(surfaceUrl("admin")).toBe("http://admin.localhost:3000");
    expect(surfaceUrl("main", "/cars")).toBe("http://localhost:3000/cars");
  });
});
