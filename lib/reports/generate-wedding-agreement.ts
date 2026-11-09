import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { WeddingEventRequest } from "@/types";

function printable(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ");
}

export async function generateWeddingAgreementPdf(
  request: WeddingEventRequest,
): Promise<Uint8Array> {
  if (request.status !== "confirmed" || request.payment_status !== "paid") {
    throw new Error("The wedding agreement is available after payment is confirmed.");
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.16, 0.22);
  const muted = rgb(0.38, 0.42, 0.48);
  let y = 780;

  const draw = (text: string, size = 11, isBold = false, color = ink) => {
    page.drawText(printable(text), {
      x: 52,
      y,
      size,
      font: isBold ? bold : regular,
      color,
      maxWidth: 490,
    });
    y -= size + 12;
  };

  draw("COSMARA", 12, true, rgb(0.68, 0.48, 0.22));
  draw("WEDDING TRANSPORT AGREEMENT", 20, true);
  draw(`Agreement reference: ${request.id.toUpperCase()}`, 10, false, muted);
  draw(`Issued: ${new Date().toLocaleDateString("en-KE")}`, 10, false, muted);
  y -= 14;
  draw("CLIENT AND EVENT", 12, true);
  draw(`Client: ${request.contact_name}`);
  draw(`Email: ${request.contact_email}`);
  draw(`Phone: ${request.contact_phone}`);
  draw(`Event date: ${new Date(`${request.event_date}T12:00:00`).toLocaleDateString("en-KE", { dateStyle: "long" })}`);
  draw(`Venue / route: ${request.venue || "To be agreed with the client"}`);
  draw(`Vehicles requested: ${request.car_count} (${request.preferred_car_types.join(", ")})`);
  draw(`Colour scheme: ${request.color_scheme}`);
  y -= 14;
  draw("QUOTED SERVICE AND PAYMENT", 12, true);
  draw(`Agreed transport amount: KSh ${(request.quote_amount ?? 0).toLocaleString("en-KE")}`, 13, true);
  draw(`Payment received: KSh ${(request.paid_amount ?? 0).toLocaleString("en-KE")}`);
  draw(`M-Pesa receipt: ${request.mpesa_receipt_number || "Not recorded"}`);
  if (request.quote_notes) {
    y -= 4;
    draw("Quote details:", 10, true);
    for (const line of request.quote_notes.split(/\r?\n/)) {
      draw(line, 10);
    }
  }
  y -= 14;
  draw("AGREEMENT SUMMARY", 12, true);
  draw("This document confirms the wedding transport service described above and the quoted amount paid by the client.");
  draw("Vehicle allocation, timings, route changes, waiting time, and other operational arrangements are to be agreed directly with Cosmara before the event.");
  draw("Any additional services or changes outside this paid quote require written agreement and may incur extra charges.");
  y -= 24;
  draw("CLIENT SIGNATURE: ______________________________", 10);
  draw("COSMARA REPRESENTATIVE: ________________________", 10);
  draw("Date: ____________________", 10);
  page.drawText("Cosmara Car Rental · Nairobi, Kenya · +254 758 500943 · cosmaragroup@gmail.com", {
    x: 52,
    y: 38,
    size: 8,
    font: regular,
    color: muted,
  });

  return pdf.save();
}

export async function downloadWeddingAgreement(request: WeddingEventRequest) {
  const bytes = await generateWeddingAgreementPdf(request);
  const buffer = new Uint8Array(bytes.byteLength);
  buffer.set(bytes);
  const blob = new Blob([buffer.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cosmara-wedding-agreement-${request.id.slice(0, 8)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
