"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Shared M-Pesa payment engine for every service (bookings, airport pickups,
 * wedding quotes, facilitator fees).
 *
 * Rules this engine enforces, so no page can break them by accident:
 *  1. The realtime subscription is NOT awaited before the STK push is sent.
 *     A slow or failed websocket never fails a payment.
 *  2. Polling runs alongside realtime as a fallback, so a dropped socket
 *     still settles the payment.
 *  3. Nothing fails on a timer. A "taking longer than expected" note is shown
 *     after SLOW_NOTICE_MS, and the payment stays open until M-Pesa or the
 *     callback reports a paid/failed value.
 *  4. Only a real paid or failed value from the database or the status route
 *     settles the payment. Pending and unknown values keep it open.
 */

export type MpesaPaymentType = "booking" | "airport" | "wedding" | "facilitator";
export type MpesaPhase = "idle" | "processing" | "waiting" | "success" | "failed";

export interface MpesaWatch {
  table: "bookings" | "airport_pickups" | "wedding_event_requests";
  id: string;
  /** Column that carries the payment outcome, e.g. "status" or "payment_status". */
  statusColumn: string;
  /** Column value that means paid. Must match what the callback writes. */
  paidValue: string;
  /** Column value that means failed. */
  failedValue: string;
  reasonColumn: string;
  receiptColumn?: string;
  amountColumn?: string;
}

export interface MpesaInitiateResult {
  success: boolean;
  error?: string | null;
  /** True when M-Pesa may still have accepted the prompt. Never a hard failure. */
  paymentMayBePending?: boolean;
}

export interface MpesaOutcome {
  receiptNumber: string | null;
  amount: number | null;
  reason: string | null;
}

export interface MpesaStartOptions {
  pollType: MpesaPaymentType;
  watch: MpesaWatch;
  /** Sends the STK push and records its own database side effects. */
  initiate: () => Promise<MpesaInitiateResult>;
  /** Customer phone. Needed to send a new prompt from the resend button. */
  phone?: string | null;
  /** Per-payment callbacks. They override the hook-level ones for this payment only. */
  onPaid?: (outcome: MpesaOutcome) => void | Promise<void>;
  onFailed?: (outcome: MpesaOutcome) => void;
}

interface MpesaPaymentStatusBody {
  status?: string;
  pending?: boolean;
  error?: string;
  reason?: string | null;
  receiptNumber?: string | null;
  amount?: number | null;
}

interface Run {
  id: number;
  startedAt: number;
  options: MpesaStartOptions | null;
  settled: boolean;
  channel: RealtimeChannel | null;
  pollTimer: ReturnType<typeof setTimeout> | null;
  slowTimer: ReturnType<typeof setTimeout> | null;
  resendTimer: ReturnType<typeof setTimeout> | null;
}

const POLL_INTERVAL_MS = 4_000;
const MAX_BACKOFF_MS = 15_000;
const SLOW_NOTICE_MS = 90_000;
/** The resend button appears after this long without a result. */
const RESEND_AFTER_MS = 45_000;
/** After this, we stop auto-checking. The payment still updates in the database. */
const MAX_POLL_MS = 10 * 60_000;

export const MPESA_DEFAULT_WAITING_MESSAGE =
  "Enter your M-Pesa PIN to approve the prompt. We will confirm once M-Pesa verifies the payment.";

const EMPTY_OUTCOME: MpesaOutcome = { receiptNumber: null, amount: null, reason: null };

function readOutcome(row: Record<string, unknown>, watch: MpesaWatch): MpesaOutcome {
  const receipt = watch.receiptColumn ? row[watch.receiptColumn] : null;
  const amount = watch.amountColumn ? row[watch.amountColumn] : null;
  const reason = row[watch.reasonColumn];
  return {
    receiptNumber: typeof receipt === "string" && receipt ? receipt : null,
    amount:
      typeof amount === "number"
        ? amount
        : typeof amount === "string" && amount !== "" && !Number.isNaN(Number(amount))
          ? Number(amount)
          : null,
    reason: typeof reason === "string" && reason ? reason : null,
  };
}

export function useMpesaPayment(handlers: {
  onPaid?: (outcome: MpesaOutcome) => void | Promise<void>;
  onFailed?: (outcome: MpesaOutcome) => void;
} = {}) {
  const [phase, setPhase] = useState<MpesaPhase>("idle");
  const [message, setMessage] = useState("");
  const [outcome, setOutcome] = useState<MpesaOutcome>(EMPTY_OUTCOME);
  /** True once the payment has waited past SLOW_NOTICE_MS. The dialog may then be closed. */
  const [slow, setSlow] = useState(false);
  /** True once a resend is allowed: after RESEND_AFTER_MS waiting, or after a failure. */
  const [canResend, setCanResend] = useState(false);

  const lastOptionsRef = useRef<MpesaStartOptions | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const runRef = useRef<Run | null>(null);
  const runCounter = useRef(0);

  const teardown = useCallback((run: Run | null) => {
    if (!run) return;
    run.settled = true;
    run.channel?.unsubscribe();
    run.channel = null;
    if (run.pollTimer) clearTimeout(run.pollTimer);
    if (run.slowTimer) clearTimeout(run.slowTimer);
    if (run.resendTimer) clearTimeout(run.resendTimer);
    run.pollTimer = null;
    run.slowTimer = null;
    run.resendTimer = null;
  }, []);

  const settle = useCallback(
    (run: Run, kind: "paid" | "failed", result: MpesaOutcome) => {
      if (runRef.current !== run || run.settled) return;
      teardown(run);
      setOutcome(result);
      setSlow(false);
      setCanResend(kind === "failed" && Boolean(run.options?.phone));
      if (kind === "paid") {
        setMessage("Your payment was received and verified.");
        setPhase("success");
        const onPaid = run.options?.onPaid ?? handlersRef.current.onPaid;
        void onPaid?.(result);
      } else {
        setMessage(result.reason ?? "M-Pesa could not complete the payment.");
        setPhase("failed");
        const onFailed = run.options?.onFailed ?? handlersRef.current.onFailed;
        onFailed?.(result);
      }
    },
    [teardown],
  );

  const start = useCallback(
    (options: MpesaStartOptions) => {
      teardown(runRef.current);
      runCounter.current += 1;
      const run: Run = {
        id: runCounter.current,
        startedAt: Date.now(),
        options,
        settled: false,
        channel: null,
        pollTimer: null,
        slowTimer: null,
        resendTimer: null,
      };
      runRef.current = run;
      lastOptionsRef.current = options;

      setPhase("processing");
      setMessage("");
      setSlow(false);
      setCanResend(false);
      setOutcome(EMPTY_OUTCOME);

      const { watch } = options;

      // 1. Listen first, but never wait for the socket. Polling covers any gap.
      const supabase = createClient();
      run.channel = supabase
        .channel(`mpesa_${watch.table}_${watch.id}_${run.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: watch.table,
            filter: `id=eq.${watch.id}`,
          },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const status = row[watch.statusColumn];
            if (status === watch.paidValue) {
              settle(run, "paid", readOutcome(row, watch));
            } else if (status === watch.failedValue) {
              settle(run, "failed", readOutcome(row, watch));
            }
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[M-Pesa] Live status connection dropped; polling will keep checking.");
          }
        });

      // 2. Send the STK push. Its result decides only whether we wait or fail now.
      void (async () => {
        let result: MpesaInitiateResult;
        try {
          result = await options.initiate();
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : "Something went wrong.",
          };
        }
        if (runRef.current !== run || run.settled) return;

        if (!result.success && !result.paymentMayBePending) {
          settle(run, "failed", {
            ...EMPTY_OUTCOME,
            reason: result.error ?? "M-Pesa request failed.",
          });
          return;
        }

        setPhase("waiting");
        setMessage(
          result.paymentMayBePending
            ? (result.error ??
                "The request may have reached M-Pesa. Do not retry if you approved it; we are checking its status.")
            : MPESA_DEFAULT_WAITING_MESSAGE,
        );

        run.slowTimer = setTimeout(() => {
          if (runRef.current !== run || run.settled) return;
          setSlow(true);
          setMessage(
            "Still waiting for M-Pesa to confirm. Check your messages; if you approved the prompt, do not retry while we verify the payment.",
          );
        }, SLOW_NOTICE_MS);

        if (options.phone) {
          run.resendTimer = setTimeout(() => {
            if (runRef.current !== run || run.settled) return;
            setCanResend(true);
          }, RESEND_AFTER_MS);
        }

        // 3. Poll as the fallback. Pending responses are normal, not failures.
        const check = async (failures: number) => {
          if (runRef.current !== run || run.settled) return;

          if (Date.now() - run.startedAt > MAX_POLL_MS) {
            setSlow(true);
            setMessage(
              "We stopped checking automatically. Check your M-Pesa messages or contact support before retrying.",
            );
            return;
          }

          let nextFailures = failures;
          try {
            const response = await fetch("/api/mpesa/payment-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: options.pollType, id: watch.id }),
              cache: "no-store",
            });
            const body = (await response.json()) as MpesaPaymentStatusBody;
            if (response.ok) {
              nextFailures = 0;
              if (body.pending === false) {
                if (body.status === watch.paidValue) {
                  settle(run, "paid", {
                    receiptNumber: body.receiptNumber ?? null,
                    amount: body.amount ?? null,
                    reason: null,
                  });
                  return;
                }
                if (body.status === watch.failedValue) {
                  settle(run, "failed", {
                    receiptNumber: null,
                    amount: null,
                    reason: body.reason ?? null,
                  });
                  return;
                }
              }
            } else if (body.pending !== true) {
              // The route marks "still processing" as pending. Only other errors count.
              nextFailures = failures + 1;
              console.error("[M-Pesa] Status check failed:", body.error);
            }
          } catch (error) {
            nextFailures = failures + 1;
            console.error("[M-Pesa] Could not check status:", error);
          }

          const delay = nextFailures
            ? Math.min(POLL_INTERVAL_MS * 2 ** Math.min(nextFailures, 2), MAX_BACKOFF_MS)
            : POLL_INTERVAL_MS;
          if (runRef.current === run && !run.settled) {
            run.pollTimer = setTimeout(() => void check(nextFailures), delay);
          }
        };
        void check(0);
      })();
    },
    [settle, teardown],
  );

  const reset = useCallback(() => {
    teardown(runRef.current);
    runRef.current = null;
    lastOptionsRef.current = null;
    setPhase("idle");
    setMessage("");
    setSlow(false);
    setCanResend(false);
    setOutcome(EMPTY_OUTCOME);
  }, [teardown]);

  /**
   * Sends a fresh prompt for the same payment. The server decides whether the
   * previous prompt has ended. This only restarts the engine with that answer.
   */
  const resend = useCallback(() => {
    const previous = lastOptionsRef.current;
    if (!previous?.phone) return;
    start({
      ...previous,
      initiate: async () => {
        try {
          const response = await fetch("/api/mpesa/resend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: previous.pollType,
              id: previous.watch.id,
              phone: previous.phone,
            }),
            cache: "no-store",
          });
          const body = (await response.json().catch(() => ({}))) as {
            state?: string;
            error?: string;
          };
          if (body.state === "sent" || body.state === "paid") return { success: true };
          if (body.state === "open") {
            return { success: false, paymentMayBePending: true, error: body.error };
          }
          return { success: false, error: body.error ?? "Could not send a new prompt." };
        } catch {
          return { success: false, error: "Could not send a new prompt. Check your connection." };
        }
      },
    });
  }, [start]);

  useEffect(() => {
    return () => teardown(runRef.current);
  }, [teardown]);

  return { phase, message, outcome, slow, canResend, start, resend, reset };
}
