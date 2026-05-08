import { NextRequest, NextResponse } from "next/server";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const SHORTCODE = process.env.MPESA_SHORTCODE!;
const PASSKEY = process.env.MPESA_PASSKEY!;
const MPESA_ENV = process.env.MPESA_ENV || "sandbox";

const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`,
  ).toString("base64");
  const res = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    },
  );

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("[Mpesa Auth] Non-JSON response:", text.slice(0, 300));
    throw new Error(
      `Mpesa auth returned non-JSON (status ${res.status}). Check CONSUMER_KEY, CONSUMER_SECRET, and MPESA_ENV.`,
    );
  }

  if (!data.access_token) {
    console.error("[Mpesa Auth] No access_token in response:", data);
    throw new Error(
      data.errorMessage ||
        data.error_description ||
        "Failed to get Mpesa access token",
    );
  }

  return data.access_token;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { checkoutRequestId: string } },
) {
  try {
    const { checkoutRequestId } = params;
    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString(
      "base64",
    );

    const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await res.json();

    // ResultCode 0 = success, 1032 = cancelled by user, 1037 = timeout
    const resultCode = data.ResultCode ?? data.errorCode;

    if (resultCode === "0" || resultCode === 0) {
      return NextResponse.json({ status: "SUCCESS" });
    }

    if (resultCode === "1032" || resultCode === 1032) {
      return NextResponse.json({
        status: "CANCELLED",
        message: "Payment was cancelled.",
      });
    }

    if (resultCode === "1037" || resultCode === 1037) {
      return NextResponse.json({
        status: "TIMEOUT",
        message: "Payment request timed out.",
      });
    }

    // Still pending (request not processed yet - common in sandbox)
    if (data.errorCode === "500.001.1001") {
      return NextResponse.json({ status: "PENDING" });
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (err) {
    console.error("[STK Status Error]", err);
    return NextResponse.json({ status: "PENDING" }); // Default to pending on error
  }
}
