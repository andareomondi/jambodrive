"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Banknote,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cancelBookingAction } from "@/lib/actions/bookings";
import type { Booking } from "@/types";

interface ManageBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess?: (updated: Booking) => void;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending:   "bg-muted text-muted-foreground",
  completed: "bg-accent text-accent-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ManageBookingModal({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: ManageBookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  // Inline confirm state — no window.confirm
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!booking) return null;

  const car = booking.cars ?? null;
  const statusClass = STATUS_STYLES[booking.status ?? "pending"];
  const canModify = booking.status === "pending";

  const handleCancelBooking = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await cancelBookingAction(booking.id);
      toast.success("Booking cancelled successfully");
      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setIsProcessing(false);
      setConfirmCancel(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmCancel(false);
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm md:max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-4 md:p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">

          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* Header */}
          <div className="mb-4">
            <Dialog.Title className="text-lg md:text-2xl font-semibold text-foreground">
              Manage Booking
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
              View and manage your booking details
            </Dialog.Description>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">

            {/* Inline cancel confirmation banner */}
            {confirmCancel && (
              <div className="flex gap-3 items-start p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-foreground">Cancel this booking?</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    This action cannot be undone. Tap Cancel Booking again to confirm.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="text-muted-foreground hover:text-foreground text-xs underline shrink-0"
                >
                  Never mind
                </button>
              </div>
            )}

            {/* Booking ID + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Booking ID</p>
                <p className="font-medium text-sm font-mono text-foreground truncate">
                  {booking.id}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={`capitalize text-xs mt-1 ${statusClass}`}>
                  {booking.status ?? "pending"}
                </Badge>
              </div>
            </div>

            {/* Vehicle */}
            <Card className="p-3 md:p-4 bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                  {car?.image ? (
                    <img
                      src={car.image}
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm md:text-base text-foreground">
                    {car?.name ?? "Vehicle"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Dates & Locations */}
            <div className="space-y-3">
              {[
                { label: "Pickup",  date: booking.pickup_date,  location: booking.pickup_location },
                { label: "Return",  date: booking.return_date,  location: booking.return_location },
              ].map(({ label, date, location }) => (
                <div key={label} className="flex gap-3 items-start">
                  <Calendar className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-sm text-foreground">{formatDate(date)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{location}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cost */}
            <Card className="p-3 md:p-4 border border-accent/20 bg-accent/5">
              <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-accent" />
                Cost Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">
                    {booking.days ?? "—"} days
                  </span>
                </div>
                {booking.insurance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance</span>
                    <span className="font-medium text-foreground">Included</span>
                  </div>
                )}
                {booking.additional_fee_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Additional Fee
                      {booking.additional_fee_reason ? ` (${booking.additional_fee_reason})` : ""}
                    </span>
                    <span className="font-medium text-destructive">
                      + Ksh {booking.additional_fee_amount}
                    </span>
                  </div>
                )}
                <div className="border-t border-accent/20 pt-2 mt-1 flex justify-between">
                  <span className="font-semibold text-foreground">Total Price</span>
                  <span className="font-bold text-accent text-base">
                    Ksh {booking.total_price.toLocaleString()}
                  </span>
                </div>
                {booking.mpesa_receipt_number && (
                  <p className="text-xs text-muted-foreground pt-1">
                    M-Pesa ref: {booking.mpesa_receipt_number}
                  </p>
                )}
              </div>
            </Card>

            {/* Notes */}
            {booking.notes && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Note: </span>
                {booking.notes}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse md:flex-row gap-2 justify-end mt-5">
            <Dialog.Close asChild>
              <Button variant="outline" className="w-full md:w-auto">
                Close
              </Button>
            </Dialog.Close>

            {canModify && (
              <Button
                onClick={handleCancelBooking}
                disabled={isProcessing}
                className={`w-full md:w-auto ${
                  confirmCancel
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground"
                }`}
              >
                {isProcessing
                  ? "Cancelling..."
                  : confirmCancel
                  ? "Confirm Cancel"
                  : "Cancel Booking"}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
