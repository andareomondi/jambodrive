import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/domain/booking-status";

describe("booking status transitions", () => {
  it("allows the forward moves admins need", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "completed")).toBe(true);
  });

  it("blocks moves out of terminal states", () => {
    expect(canTransition("completed", "confirmed")).toBe(false);
    expect(canTransition("cancelled", "pending")).toBe(false);
    expect(canTransition("failed", "confirmed")).toBe(false);
  });

  it("blocks skipping steps", () => {
    expect(canTransition("pending", "completed")).toBe(false);
  });
});
