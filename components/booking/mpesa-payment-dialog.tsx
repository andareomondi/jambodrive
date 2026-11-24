"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import {
  CheckCircle,
  Copy,
  Loader2,
  Phone,
  Smartphone,
  Wifi,
  XCircle,
} from "lucide-react";

export type MpesaPaymentDialogState = "processing" | "waiting" | "success" | "failed";

// Official Cosmara M-Pesa support line
export const MPESA_SUPPORT_NUMBER = "254758500943";

/**
 * The one M-Pesa payment modal for every service. Its look matches the car
 * rental and booking flows. The payment logic lives in useMpesaPayment, so this
 * component only renders the state it is given.
 *
 * It cannot be dismissed while a prompt is pending, except after the slow
 * notice (`canDismiss`). Then the payment keeps tracking in the database.
 */
export function MpesaPaymentDialog({
  open,
  state,
  phone,
  amount,
  description,
  message,
  receiptNumber,
  canDismiss = false,
  canResend = false,
  onClose,
  onRetry,
  onResend,
  supportPhone = MPESA_SUPPORT_NUMBER,
}: {
  open: boolean;
  state: MpesaPaymentDialogState;
  phone?: string | null;
  amount?: number | null;
  description: string;
  message?: string;
  receiptNumber?: string | null;
  canDismiss?: boolean;
  canResend?: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onResend?: () => void;
  supportPhone?: string;
}) {
  const isPending = state === "processing" || state === "waiting";
  const closable = !isPending || canDismiss;

  const copyReceipt = async () => {
    if (!receiptNumber) return;
    try {
      await navigator.clipboard.writeText(receiptNumber);
      toast.success("Receipt number copied!");
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && closable) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (!closable) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!closable) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!closable) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[80] max-h-[90vh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card p-7 text-center shadow-2xl"
        >
          {state === "processing" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <Dialog.Title className="mb-1 text-xl font-bold text-foreground">
                  Connecting to M-Pesa
                </Dialog.Title>
                <Dialog.Description
                  role="status"
                  aria-live="polite"
                  className="text-sm text-muted-foreground"
                >
                  Preparing your {description} payment and reaching Safaricom...
                </Dialog.Description>
              </div>
            </div>
          )}

          {state === "waiting" && (
            <div className="relative flex flex-col items-center gap-5 overflow-hidden py-4">
              <div className="absolute left-0 top-0 h-1 w-full animate-pulse bg-primary" />
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card shadow-inner">
                  <Smartphone className="h-9 w-9 text-primary" />
                  <Wifi className="absolute -right-1 -top-1 h-4 w-4 animate-pulse text-primary" />
                </div>
              </div>

              <div>
                <Dialog.Title className="mb-2 text-xl font-bold text-foreground">
                  Check your phone
                </Dialog.Title>
                <Dialog.Description
                  role="status"
                  aria-live="polite"
                  className="text-sm leading-6 text-muted-foreground"
                >
                  An M-Pesa prompt has been sent
                  {phone ? (
                    <>
                      {" "}to <span className="font-medium text-foreground">{phone}</span>
                    </>
                  ) : null}
                  . Enter your PIN to approve
                  {amount != null && amount > 0 ? (
                    <>
                      {" "}
                      <span className="font-bold text-foreground">
                        KSh {amount.toLocaleString("en-KE")}
                      </span>
                    </>
                  ) : null}
                  .
                </Dialog.Description>
              </div>

              <div className="flex w-full items-center justify-center gap-3 rounded-xl bg-muted px-4 py-3">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {message || "Waiting for your confirmation..."}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Prompt not received?{" "}
                <a
                  href={`tel:+${supportPhone}`}
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  <Phone className="h-3 w-3" /> Call support
                </a>
              </p>

              {canResend && onResend && (
                <button
                  type="button"
                  onClick={onResend}
                  className="w-full rounded-xl border border-border px-5 py-3 font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Didn&apos;t get a prompt? Send a new one
                </button>
              )}

              {canDismiss && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-muted px-5 py-3 font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  Close and keep tracking
                </button>
              )}
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <Dialog.Title className="mb-2 text-xl font-bold text-foreground">
                  Payment confirmed
                </Dialog.Title>
                <Dialog.Description
                  role="status"
                  aria-live="polite"
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {message || "Your payment was received and verified."}
                </Dialog.Description>
              </div>

              {amount != null && amount > 0 && (
                <p className="text-lg font-bold text-foreground">
                  KSh {amount.toLocaleString("en-KE")}
                </p>
              )}

              {receiptNumber && (
                <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">M-Pesa receipt</p>
                    <span className="font-mono text-lg font-bold text-foreground">
                      {receiptNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyReceipt}
                    aria-label="Copy receipt number"
                    className="rounded-lg p-2 hover:bg-muted"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}

          {state === "failed" && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <Dialog.Title className="mb-2 text-xl font-bold text-foreground">
                  Payment needs attention
                </Dialog.Title>
                <Dialog.Description
                  role="alert"
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {message || "We could not confirm this payment."}
                </Dialog.Description>
              </div>

              <div className="flex w-full flex-col gap-3">
                {canResend && onResend && (
                  <button
                    type="button"
                    onClick={onResend}
                    className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Send a new M-Pesa prompt
                  </button>
                )}
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Try again
                  </button>
                )}
                <a
                  href={`tel:+${supportPhone}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-5 py-3 text-center font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  <Phone className="h-4 w-4" /> Contact support
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl px-5 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
