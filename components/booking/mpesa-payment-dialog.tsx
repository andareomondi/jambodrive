"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle, Loader2, Smartphone, XCircle } from "lucide-react";

export type MpesaPaymentDialogState =
  | "processing"
  | "waiting"
  | "success"
  | "failed";

export function MpesaPaymentDialog({
  open,
  state,
  phone,
  amount,
  description,
  message,
  onClose,
}: {
  open: boolean;
  state: MpesaPaymentDialogState;
  phone?: string | null;
  amount?: number | null;
  description: string;
  message?: string;
  onClose: () => void;
}) {
  const isPending = state === "processing" || state === "waiting";
  const title =
    state === "processing"
      ? "Connecting to M-Pesa"
      : state === "waiting"
        ? "Check your phone"
        : state === "success"
          ? "Payment confirmed"
          : "Payment needs attention";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          onEscapeKeyDown={(event) => {
            if (isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (isPending) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-7 text-center shadow-2xl"
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              state === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : state === "failed"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent/10 text-accent"
            }`}
          >
            {state === "processing" ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : state === "waiting" ? (
              <Smartphone className="h-8 w-8" />
            ) : state === "success" ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
          </div>
          <Dialog.Title className="text-xl font-bold text-foreground">
            {title}
          </Dialog.Title>
          <Dialog.Description
            role={state === "failed" ? "alert" : "status"}
            aria-live={state === "failed" ? "assertive" : "polite"}
            className="mt-2 text-sm leading-6 text-muted-foreground"
          >
            {state === "processing"
              ? `Preparing your ${description} payment.`
              : state === "waiting"
                ? `${message ?? "Enter your M-Pesa PIN to approve the prompt."}${phone ? ` Prompt sent to ${phone}.` : ""}`
                : state === "success"
                  ? message ?? "Your payment was received and verified."
                  : message ?? "We could not confirm this payment."}
          </Dialog.Description>
          {amount != null && amount > 0 && (
            <p className="mt-3 text-lg font-bold text-foreground">
              KSh {amount.toLocaleString("en-KE")}
            </p>
          )}
          {!isPending && (
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Done
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
