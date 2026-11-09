"use client";

import { useEffect, useRef } from "react";

export type MpesaPaymentType = "booking" | "airport" | "wedding" | "facilitator";

export interface MpesaPaymentStatusResult {
  status?: string;
  pending?: boolean;
  error?: string;
  reason?: string | null;
  receiptNumber?: string | null;
  amount?: number | null;
}

export function useMpesaStatusPolling(
  type: MpesaPaymentType,
  id: string | null | undefined,
  enabled: boolean,
  onComplete: (result: MpesaPaymentStatusResult) => void,
) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!enabled || !id) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;

    const check = async () => {
      try {
        const response = await fetch("/api/mpesa/payment-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id }),
          cache: "no-store",
        });
        const result = (await response.json()) as MpesaPaymentStatusResult;
        if (!response.ok) {
          failures += 1;
          console.error("[M-Pesa status polling] Check failed:", result.error);
        } else if (active && result.pending === false) {
          onCompleteRef.current(result);
          return;
        }
      } catch (error) {
        failures += 1;
        console.error("[M-Pesa status polling] Could not check status:", error);
      }

      if (active) {
        timer = setTimeout(check, Math.min(5_000 * 2 ** Math.min(failures, 3), 30_000));
      }
    };

    void check();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, id, type]);
}
