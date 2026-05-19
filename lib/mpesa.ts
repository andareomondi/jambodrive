async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString("base64");

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } },
  );

  const data = await res.json();
  console.log("Token Response:", data);
  return data.access_token;
}
console.log("MPESA Consumer Key:", process.env.MPESA_CONSUMER_KEY);
console.log("MPESA Consumer Secret:", process.env.MPESA_CONSUMER_SECRET);
export async function initiateStkPush(
  phone: string,
  amount: number,
  bookingId: string,
) {
  const token = await getAccessToken();

  const shortCode = process.env.MPESA_SHORT_CODE!;
  const passKey = process.env.MPESA_PASS_KEY!;
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString(
    "base64",
  );

  const formatted = phone.replace(/^0/, "254").replace(/^\+/, "");
  console.log("[STK Request]", {
    token,
    shortCode,
    password,
    timestamp,
    formatted,
    callbackURL: process.env.MPESA_CALLBACK_URL,
  });

  const res = await fetch(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: formatted,
        PartyB: shortCode,
        PhoneNumber: formatted,
        CallBackURL: process.env.MPESA_CALLBACK_URL!,
        AccountReference: `COZY-${bookingId}`,
        TransactionDesc: "Cozy Mobility Tours Booking",
      }),
    },
  );

  return res.json();
}
