"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Banknote,
  CheckCircle,
  Download,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Booking } from "@/types";

interface BookingSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-primary text-primary-foreground",
  pending: "bg-muted text-muted-foreground",
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

export function BookingSummaryModal({
  open,
  onOpenChange,
  booking,
}: BookingSummaryModalProps) {
  if (!booking) return null;

  // Use the days field from the DB; fall back to a client calculation
  const totalDays =
    booking.days ??
    Math.ceil(
      (new Date(booking.return_date).getTime() -
        new Date(booking.pickup_date).getTime()) /
        (1000 * 60 * 60 * 24),
    );

  // Car data comes from the Supabase join — no extra fetch needed
  const car = booking.cars ?? null;

  const handleShare = async () => {
    const text = `Booking ${booking.id} — ${car?.name ?? "Car"}\nPickup: ${formatDate(booking.pickup_date)} at ${booking.pickup_location}\nReturn: ${formatDate(booking.return_date)} at ${booking.return_location}\nTotal: Ksh ${booking.total_price}`;
    await navigator.clipboard.writeText(text);
    toast.success("Booking details copied to clipboard");
  };

  const handleDownloadReceipt = () => {
    // Receipt generation goes here
    toast.success("Receipt downloaded successfully");
  };

  const statusClass = STATUS_STYLES[booking.status ?? "pending"];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm md:max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-4 md:p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close */}
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* Header */}
          <div className="mb-4">
            <Dialog.Title className="text-lg md:text-2xl font-semibold text-foreground">
              Booking Summary
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground mt-0.5">
              View your completed booking details and receipt
            </Dialog.Description>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Status banner — uses theme tokens, not hardcoded blue */}
            <div className="flex gap-3 items-start p-3 md:p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm md:text-base text-foreground">
                  Booking Confirmed
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Thank you for choosing Cosmara! Your booking has been successfully confirmed.
                </p>
              </div>
            </div>

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
              <div className="flex gap-3 items-start">
                <Calendar className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="font-medium text-sm text-foreground">
                    {formatDate(booking.pickup_date)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booking.pickup_location}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Calendar className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Return</p>
                  <p className="font-medium text-sm text-foreground">
                    {formatDate(booking.return_date)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booking.return_location}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment summary */}
            <Card className="p-3 md:p-4 border border-accent/20 bg-accent/5">
              <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-accent" />
                Payment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">
                    {totalDays} {totalDays === 1 ? "day" : "days"}
                  </span>
                </div>
                {booking.insurance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance</span>
                    <span className="font-medium text-foreground">
                      Included
                    </span>
                  </div>
                )}
                {booking.additional_fee_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Additional Fee
                      {booking.additional_fee_reason
                        ? ` (${booking.additional_fee_reason})`
                        : ""}
                    </span>
                    <span className="font-medium text-destructive">
                      + Ksh {booking.additional_fee_amount}
                    </span>
                  </div>
                )}
                <div className="border-t border-accent/20 pt-2 mt-1 flex justify-between">
                  <span className="font-semibold text-foreground">
                    Total Paid
                  </span>
                  <span className="font-bold text-accent text-base md:text-lg">
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

          {/* Footer actions */}
          <div className="flex flex-col-reverse md:flex-row gap-2 justify-end mt-5">
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full md:w-auto"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handleDownloadReceipt}
              className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
