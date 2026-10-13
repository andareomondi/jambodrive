import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Car } from "@/types";

interface GenerateReceiptOptions {
  origin?: string;
}

export async function generateBookingReceiptPdf(
  bookingInput: Booking | string,
  options: GenerateReceiptOptions = {}
): Promise<Uint8Array> {
  const supabase = createClient();
  let booking: Booking;

  const origin = options.origin || "https://cosmara.co.ke";

  // 1. Fetch booking if an ID string was provided
  if (typeof bookingInput === "string") {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        cars ( id, name, model, image, chauffeured, price ),
        profiles ( full_name, email, phone )
      `)
      .eq("id", bookingInput)
      .single();

    if (error || !data) {
      throw new Error("Failed to fetch booking details for receipt.");
    }
    booking = data as Booking;
  } else {
    booking = bookingInput;
  }

  // 2. Ensure relations are populated
  if (booking.id && (!booking.cars || !booking.profiles || !booking.profiles.full_name)) {
    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        cars ( id, name, model, image, chauffeured, price ),
        profiles ( full_name, email, phone )
      `)
      .eq("id", booking.id)
      .single();

    if (data) {
      booking = { ...booking, ...data };
    }
  }

  // Safely extract expanded car fields beyond standard Pick type
  const carDetails = booking.cars as (Car | undefined);

  // Validate mpesa_receipt_number to ensure it's not accidentally a phone number
  const rawReceipt = booking.mpesa_receipt_number;
  const isPhoneReceipt = rawReceipt && /^(\+?254|0)?[17]\d{8}$/.test(rawReceipt.replace(/\s+/g, ""));
  const receiptRef = (rawReceipt && !isPhoneReceipt) 
    ? rawReceipt 
    : booking.id.slice(0, 8).toUpperCase();

  const pdfDoc = await PDFDocument.create();
  
  // Fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Palette
  const colorPrimary = rgb(0.1, 0.1, 0.1);
  const colorMuted = rgb(0.4, 0.4, 0.4);
  const colorAccent = rgb(0.08, 0.52, 0.36); // Emerald / Accent color
  const colorDestructive = rgb(0.85, 0.2, 0.2);
  const colorBgLight = rgb(0.96, 0.97, 0.98);
  const colorBorder = rgb(0.82, 0.85, 0.88);

  // ==========================================
  // PAGE 1: CAR HIRE RECEIPT & INVOICE
  // ==========================================
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
  const { width, height } = page1.getSize();
  let cursorY = height - 40;

  // Title & Header Badge
  page1.drawText("CAR HIRE RECEIPT", {
    x: 40,
    y: cursorY,
    size: 22,
    font: fontBold,
    color: colorPrimary,
  });

  page1.drawText(`Receipt #: ${receiptRef}`, {
    x: width - 180,
    y: cursorY + 4,
    size: 10,
    font: fontBold,
    color: colorAccent,
  });

  cursorY -= 25;
  page1.drawLine({
    start: { x: 40, y: cursorY },
    end: { x: width - 40, y: cursorY },
    thickness: 1.5,
    color: colorAccent,
  });

  // ── Agency vs Client Info Columns ────────────────────────────────────────
  cursorY -= 20;
  const colWidth = (width - 95) / 2;

  // Agency Box (Left)
  page1.drawRectangle({
    x: 40,
    y: cursorY - 85,
    width: colWidth,
    height: 80,
    color: colorBgLight,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  let agencyY = cursorY - 15;
  page1.drawText("AGENCY", { x: 52, y: agencyY, size: 8, font: fontBold, color: colorAccent });
  agencyY -= 14;
  page1.drawText("Name: Cosmara Car Rental", { x: 52, y: agencyY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  agencyY -= 12;
  page1.drawText("Street Address: Ngong Road / CBD", { x: 52, y: agencyY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  agencyY -= 12;
  page1.drawText("City, State, ZIP: Nairobi, 00100", { x: 52, y: agencyY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  agencyY -= 12;
  page1.drawText("Phone: +254 758 500943 | Email: cosmaragroup@gmail.com", { x: 52, y: agencyY, size: 8, font: fontHelvetica, color: colorMuted });

  // Client Box (Right)
  const clientX = 45 + colWidth;
  page1.drawRectangle({
    x: clientX,
    y: cursorY - 85,
    width: colWidth,
    height: 80,
    color: colorBgLight,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  let clientY = cursorY - 15;
  page1.drawText("CLIENT", { x: clientX + 12, y: clientY, size: 8, font: fontBold, color: colorAccent });
  clientY -= 14;
  const clientName = booking.profiles?.full_name ?? "Valued Customer";
  const clientPhone = booking.profiles?.phone ?? "N/A";
  const clientEmail = booking.profiles?.email ?? "N/A";
  page1.drawText(`Name: ${clientName}`, { x: clientX + 12, y: clientY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  clientY -= 12;
  page1.drawText(`Phone: ${clientPhone}`, { x: clientX + 12, y: clientY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  clientY -= 12;
  page1.drawText(`Email: ${clientEmail}`, { x: clientX + 12, y: clientY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  clientY -= 12;
  page1.drawText(`Booking ID: #${booking.id.toUpperCase()}`, { x: clientX + 12, y: clientY, size: 8, font: fontHelvetica, color: colorMuted });

  cursorY -= 100;

  // ── Trip Information & Vehicle Details Box ──────────────────────────────
  const tripBoxHeight = booking.status === "failed" ? 115 : 95;
  page1.drawRectangle({
    x: 40,
    y: cursorY - tripBoxHeight,
    width: width - 80,
    height: tripBoxHeight,
    color: colorBgLight,
    borderColor: colorBorder,
    borderWidth: 1,
  });

  let tripY = cursorY - 16;
  page1.drawText("TRIP INFORMATION & VEHICLE DETAILS", { x: 52, y: tripY, size: 8, font: fontBold, color: colorAccent });
  tripY -= 16;

  const vehicleName = booking.cars?.name ?? "Reserved Vehicle";
  const vehicleModel = carDetails?.model ? ` (${carDetails.model})` : "";
  const vehicleId = carDetails?.id;
  const vehicleUrl = vehicleId ? `${origin}/cars/${vehicleId}` : `${origin}/cars`;
  const isChauffeured = carDetails?.chauffeured ? "Yes (Driver Included)" : "Self-Drive";

  page1.drawText(`Vehicle: ${vehicleName}${vehicleModel}  |  Chauffeured: ${isChauffeured}`, { x: 52, y: tripY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  
  // Clickable Link Annotation for Vehicle
  page1.drawText(`[ View Car Online ]`, { x: 420, y: tripY, size: 8.5, font: fontBold, color: colorAccent });
  const linkRef = pdfDoc.context.register(
    pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [418, tripY - 2, 510, tripY + 10],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: vehicleUrl },
    })
  );
  page1.node.addAnnot(linkRef);

  tripY -= 16;
  const pickupDateFormatted = new Date(booking.pickup_date).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
  const returnDateFormatted = new Date(booking.return_date).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
  page1.drawText(`Pickup: ${pickupDateFormatted} at ${booking.pickup_location}`, { x: 52, y: tripY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  
  tripY -= 16;
  page1.drawText(`Return: ${returnDateFormatted} at ${booking.return_location}`, { x: 52, y: tripY, size: 8.5, font: fontHelvetica, color: colorPrimary });

  tripY -= 16;
  const statusStr = (booking.status ?? "pending").toUpperCase();
  page1.drawText(`Status: ${statusStr}`, { x: 52, y: tripY, size: 8.5, font: fontBold, color: statusStr === "FAILED" ? colorDestructive : colorAccent });
  page1.drawText(`Payment Method: M-Pesa STK Push`, { x: 250, y: tripY, size: 8.5, font: fontHelvetica, color: colorPrimary });

  if (booking.status === "failed" && booking.payment_failure_reason) {
    tripY -= 16;
    page1.drawText(`Failure Reason: ${booking.payment_failure_reason}`, { x: 52, y: tripY, size: 8.5, font: fontBold, color: colorDestructive });
  }

  cursorY -= (tripBoxHeight + 15);

  // ── Financial Itemized Table ───────────────────────────────────────────
  page1.drawText("ITEMIZED CHARGES", { x: 40, y: cursorY, size: 10, font: fontBold, color: colorPrimary });
  cursorY -= 8;

  // Table Header
  page1.drawRectangle({ x: 40, y: cursorY - 18, width: width - 80, height: 18, color: colorPrimary });
  page1.drawText("Date", { x: 50, y: cursorY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText("Description / Pickup-Dropoff", { x: 130, y: cursorY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText("Duration", { x: 350, y: cursorY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText("Amount (Ksh)", { x: width - 125, y: cursorY - 12, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  cursorY -= 26;
  const totalDays = booking.days ?? 1;
  const baseRate = booking.total_price - (booking.additional_fee_amount ?? 0);

  // Table Row 1: Base Rental
  page1.drawText(pickupDateFormatted, { x: 50, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  page1.drawText(`Vehicle Hire: ${vehicleName}`, { x: 130, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  page1.drawText(`${totalDays} ${totalDays === 1 ? "day" : "days"}`, { x: 350, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  page1.drawText(baseRate.toLocaleString(), { x: width - 125, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });

  // Table Row 2: Additional Fees if any
  if (booking.additional_fee_amount && booking.additional_fee_amount > 0) {
    cursorY -= 16;
    page1.drawText(pickupDateFormatted, { x: 50, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
    page1.drawText(`Extra Fee: ${booking.additional_fee_reason ?? "Inspection/Damage"}`, { x: 130, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
    page1.drawText("1 item", { x: 350, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
    page1.drawText(booking.additional_fee_amount.toLocaleString(), { x: width - 125, y: cursorY, size: 8.5, font: fontHelvetica, color: colorPrimary });
  }

  cursorY -= 15;
  page1.drawLine({ start: { x: 40, y: cursorY }, end: { x: width - 40, y: cursorY }, thickness: 1, color: colorBorder });

  // Totals Section
  cursorY -= 20;
  const summaryX = width - 230;
  
  const drawSummaryLine = (label: string, value: string, isBold = false, isAccent = false) => {
    page1.drawText(label, { x: summaryX, y: cursorY, size: isBold ? 10 : 9, font: isBold ? fontBold : fontHelvetica, color: colorPrimary });
    page1.drawText(value, { x: width - 125, y: cursorY, size: isBold ? 10 : 9, font: isBold ? fontBold : fontHelvetica, color: isAccent ? colorAccent : colorPrimary });
    cursorY -= 16;
  };

  drawSummaryLine("Subtotal:", `Ksh ${baseRate.toLocaleString()}`);
  if (booking.additional_fee_amount && booking.additional_fee_amount > 0) {
    drawSummaryLine("Additional Fees:", `Ksh ${booking.additional_fee_amount.toLocaleString()}`);
  }
  drawSummaryLine("Tax / VAT (Incl.):", "Ksh 0.00");
  drawSummaryLine("Total Amount:", `Ksh ${booking.total_price.toLocaleString()}`, true, true);
  drawSummaryLine("Amount Paid:", `Ksh ${booking.status === "confirmed" || booking.status === "completed" ? booking.total_price.toLocaleString() : "0.00"}`, true);

  // Page 1 Footer
  page1.drawLine({ start: { x: 40, y: 45 }, end: { x: width - 40, y: 45 }, thickness: 0.5, color: colorBorder });
  page1.drawText("Page 1 of 2 — Official Cosmara Car Hire Receipt. Terms & Conditions apply on the following page.", {
    x: 40,
    y: 32,
    size: 7.5,
    font: fontHelvetica,
    color: colorMuted,
  });


  // ==========================================
  // PAGE 2: GENERAL TERMS & CONDITIONS
  // ==========================================
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  let tcY = height - 40;

  page2.drawText("COSMARA CAR RENTAL — GENERAL TERMS & CONDITIONS", {
    x: 40,
    y: tcY,
    size: 11,
    font: fontBold,
    color: colorPrimary,
  });

  tcY -= 14;
  page2.drawText("By completing this car hire transaction with Cosmara, you agree to the following binding terms:", {
    x: 40,
    y: tcY,
    size: 8,
    font: fontHelvetica,
    color: colorMuted,
  });

  tcY -= 8;
  page2.drawLine({ start: { x: 40, y: tcY }, end: { x: width - 40, y: tcY }, thickness: 1, color: colorAccent });

  const terms = [
    ["1. Rental Agreement & Driver Requirements:", "The driver must be at least 21 years old with a valid driver's license. Cosmara reserves the right to refuse rental to anyone who does not meet safety or legal criteria."],
    ["2. Vehicle Condition & Inspection:", "You must inspect the vehicle before leaving the lot and report any existing damage. You are responsible for all non-wear-and-tear interior and exterior damages incurred during your rental period."],
    ["3. Fuel Policy:", "Vehicles are provided with a full tank and must be returned full. Deficits incur refill charges at premium rates plus service fees."],
    ["4. Mileage & Lawful Usage:", "Unlimited mileage is included. Vehicles must be used strictly for lawful purposes; off-road racing or unauthorized modifications/usage is prohibited."],
    ["5. Insurance & Liability:", "Optional insurance plans are available at checkout. Customers are responsible for maintaining valid coverage; Cosmara is not liable for personal injury or loss of personal belongings."],
    ["6. Late Returns & Extensions:", "Late returns incur additional charges (hourly rates up to 24 hours late, daily rates beyond). Contact support immediately if an extension is needed."],
    ["7. Cancellation & Modification:", "Cancellations 24+ hours before pickup are refunded in full. Late cancellations within 24 hours may incur a fee."],
    ["8. Maintenance & Repairs:", "Report mechanical issues immediately. Do not attempt independent repairs; roadside assistance is provided."],
    ["9. Traffic Violations & Fines:", "The hirer is fully responsible for all traffic fines, parking tickets, and tolls incurred during booking duration."],
    ["10. Security Deposit & Payments:", "Payments are due at pickup. Security deposits are refunded within 10 business days following return inspection."],
  ];

  tcY -= 16;
  for (const [title, desc] of terms) {
    if (tcY < 50) break;
    page2.drawText(title, { x: 40, y: tcY, size: 8, font: fontBold, color: colorPrimary });
    tcY -= 10;
    
    const maxCharsPerLine = 95;
    let currentLine = "";
    const words = desc.split(" ");
    for (const word of words) {
      if ((currentLine + word).length > maxCharsPerLine) {
        page2.drawText(currentLine.trim(), { x: 40, y: tcY, size: 7.5, font: fontHelvetica, color: colorMuted });
        tcY -= 10;
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    }
    if (currentLine.trim().length > 0) {
      page2.drawText(currentLine.trim(), { x: 40, y: tcY, size: 7.5, font: fontHelvetica, color: colorMuted });
      tcY -= 10;
    }
    tcY -= 3;
  }

  // Page 2 Footer
  page2.drawLine({ start: { x: 40, y: 35 }, end: { x: width - 40, y: 35 }, thickness: 0.5, color: colorBorder });
  page2.drawText("Page 2 of 2 — Cosmara Car Rental Terms & Conditions. Visit https://cosmara.co.ke/terms for complete details.", {
    x: 40,
    y: 22,
    size: 7,
    font: fontHelvetica,
    color: colorMuted,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
