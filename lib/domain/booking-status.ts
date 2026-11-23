import type { BookingStatus } from "@/types";

/** Which booking status changes an admin may make. Terminal states are final. */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled", "failed"],
  confirmed: ["completed", "cancelled", "failed"],
  completed: [],
  cancelled: [],
  failed: [],
};

export function canTransition(from: BookingStatus | null, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from ?? "pending"]?.includes(to) ?? false;
}
