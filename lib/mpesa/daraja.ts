/**
 * Server-side Daraja (Safaricom M-Pesa) client. Every response is read as
 * text first, so an HTML error page from Safaricom or a gateway becomes a
 * clear DarajaUnavailableError instead of an unparsed SyntaxError.
 */

export class DarajaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DarajaUnavailableError";
  }
}

export type DarajaQuery =
  | { state: "pending" }
  | { state: "paid"; receiptNumber: string | null; transactionDate: string | null; amount: number }
  | { state: "failed"; reason: string };

export function getMpesaBaseUrl(): string {
  return process.env.MPESA_ENVIRONMENT === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export function getTimestamp(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** Parses a Daraja body as JSON, or throws DarajaUnavailableError with the HTTP status. */
export async function parseDarajaJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Fall through to the unavailable error below.
  }
  throw new DarajaUnavailableError(
    `M-Pesa returned an unexpected response (HTTP ${response.status}). Trying again shortly.`,
  );
}

export async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials are not configured.");
  }
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await fetch(
    `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` }, cache: "no-store" },
  );
  if (!response.ok) {
    throw new DarajaUnavailableError(`M-Pesa token request failed (HTTP ${response.status}).`);
  }
  const data = await parseDarajaJson(response);
  if (typeof data.access_token !== "string") {
    throw new DarajaUnavailableError("M-Pesa did not return an access token.");
  }
  return data.access_token;
}

export function getFailureReason(resultCode: number, description?: string): string {
  const knownReasons: Record<number, string> = {
    1: "There is not enough M-Pesa balance to complete this payment. If you have Fuliza, accept its prompt, or top up and try again.",
    17: "M-Pesa could not complete the request. Please try again later.",
    1032: "The M-Pesa payment was cancelled on the phone.",
    1037: "The M-Pesa prompt timed out before it was approved.",
    2001: "The M-Pesa PIN was not accepted. Check your PIN and try again.",
  };
  return (
    knownReasons[resultCode] ??
    (description
      ? `M-Pesa could not complete the payment: ${description}`
      : `M-Pesa could not complete the payment (error ${resultCode}).`)
  );
}

/**
 * Asks Daraja for the final result of an STK push. Returns "pending" while the
 * customer has not answered. Throws DarajaUnavailableError when Daraja cannot
 * answer, so callers never treat an outage as a payment result.
 */
export async function queryStkPush(checkoutRequestId: string, expectedAmount: number): Promise<DarajaQuery> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("M-Pesa payment-check configuration is incomplete.");
  }
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
  const token = await getAccessToken();

  const response = await fetch(`${getMpesaBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  });
  const result = await parseDarajaJson(response);

  // Daraja answers "still being processed" as an error. That means the customer has not finished.
  if (String(result.ResponseCode ?? "") !== "0") {
    if (String(result.errorCode ?? "") === "500.001.1001" || response.status >= 500) {
      return { state: "pending" };
    }
    throw new DarajaUnavailableError(
      typeof result.errorMessage === "string"
        ? result.errorMessage
        : "M-Pesa has not returned a final payment status yet.",
    );
  }

  const resultCode = Number(result.ResultCode);
  if (!Number.isFinite(resultCode)) return { state: "pending" };
  if (resultCode !== 0) {
    return {
      state: "failed",
      reason: getFailureReason(resultCode, typeof result.ResultDesc === "string" ? result.ResultDesc : undefined),
    };
  }
  return {
    state: "paid",
    receiptNumber: typeof result.MpesaReceiptNumber === "string" ? result.MpesaReceiptNumber : null,
    transactionDate: typeof result.TransactionDate === "string" ? result.TransactionDate : null,
    amount: expectedAmount,
  };
}
