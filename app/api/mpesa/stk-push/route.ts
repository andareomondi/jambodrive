import { NextRequest, NextResponse } from "next/server";

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!;
const SHORTCODE = process.env.MPESA_SHORTCODE!;
const PASSKEY = process.env.MPESA_PASSKEY!;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL!; // e.g. https://yourdomain.com/api/mpesa/callback
const MPESA_ENV = process.env.MPESA_ENV || "sandbox"; // "sandbox" | "production"

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

export async function POST(req: NextRequest) {
  try {
    const { phone, amount } = await req.json();

    if (!phone || !amount) {
      return NextResponse.json(
        { error: "Phone and amount are required" },
        { status: 400 },
      );
    }

    // Normalize phone: strip leading 0 or +254, ensure 254XXXXXXXXX
    const normalized = phone.replace(/^\+/, "").replace(/^0/, "254");
    if (!/^2547\d{8}$/.test(normalized)) {
      return NextResponse.json(
        { error: "Invalid Kenyan phone number" },
        { status: 400 },
      );
    }

    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString(
      "base64",
    );

    const body = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount), // Mpesa requires whole numbers
      PartyA: normalized,
      PartyB: SHORTCODE,
      PhoneNumber: normalized,
      CallBackURL: CALLBACK_URL,
      AccountReference: "CozyCars",
      TransactionDesc: "Car Rental Payment",
    };

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== "0") {
      return NextResponse.json(
        {
          error:
            stkData.errorMessage ||
            stkData.ResponseDescription ||
            "STK push failed",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
    });
  } catch (err: any) {
    console.error("[STK Push Error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
