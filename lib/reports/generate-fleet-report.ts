import {
  PDFDocument,
  PDFName,
  PDFString,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { Car } from "@/types";

// ── Layout constants ──────────────────────────────────────────────────────────

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const NAME_SIZE = 12;
const BODY_SIZE = 10;
const LINK_SIZE = 9;
const LINE_HEIGHT = 14;

const INK = rgb(0.13, 0.13, 0.15);
const MUTED = rgb(0.45, 0.45, 0.48);
const BODY_COLOR = rgb(0.32, 0.32, 0.35);
const ACCENT = rgb(0.02, 0.45, 0.36);
const LINK_COLOR = rgb(0.16, 0.36, 0.75);
const RULE = rgb(0.87, 0.87, 0.88);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * pdf-lib's standard fonts can only render the characters listed in
 * `font.getCharacterSet()` (WinAnsi/CP1252 for Helvetica). Real car data often
 * carries characters outside that set — most commonly invisible bidi/
 * formatting marks like U+200E (LEFT-TO-RIGHT MARK) that mobile keyboards
 * silently insert — which makes `drawText` throw a "WinAnsi cannot encode"
 * error. This builds a per-font filter that drops anything the font can't
 * actually draw, so report generation never crashes on unexpected input.
 */
function buildTextSanitizer(font: PDFFont): (text: string) => string {
  const supported = new Set(font.getCharacterSet());
  return (text: string) => {
    let safe = "";
    for (const char of text) {
      if (char === "\n" || char === "\t") {
        safe += " ";
        continue;
      }
      const codePoint = char.codePointAt(0) ?? 0;
      if (supported.has(codePoint)) {
        safe += char;
      }
      // else: silently drop the unencodable character (e.g. invisible
      // formatting marks, emoji, or scripts outside WinAnsi) instead of
      // letting pdf-lib throw.
    }
    // Dropped characters can leave behind doubled-up whitespace; tidy it.
    return safe.replace(/ {2,}/g, " ").trim();
  };
}

/** Greedy word-wrap using actual glyph widths (pdf-lib does not wrap text for you). */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/** Adds a clickable URI link annotation over a text region. */
function addLinkAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  rect: { x: number; y: number; width: number; height: number },
  url: string,
) {
  const annotation = pdfDoc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(url),
    },
  });
  const annotationRef = pdfDoc.context.register(annotation);
  const existingAnnots = page.node.Annots();
  if (existingAnnots) {
    existingAnnots.push(annotationRef);
  } else {
    page.node.set(PDFName.of("Annots"), pdfDoc.context.obj([annotationRef]));
  }
}

// ── Report generator ──────────────────────────────────────────────────────────

export interface GenerateFleetReportOptions {
  /** e.g. window.location.origin, used to build absolute links to each car page. */
  origin?: string;
}

export async function generateFleetReportPdf(
  cars: Car[],
  options: GenerateFleetReportOptions = {},
): Promise<Uint8Array> {
  const origin = options.origin ?? "";

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Fleet Report");
  pdfDoc.setProducer("Cosmara Admin");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sanitize = buildTextSanitizer(font);
  const sanitizeBold = buildTextSanitizer(fontBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawMainHeader = () => {
    page.drawText("Fleet Report", {
      x: MARGIN,
      y,
      size: 20,
      font: fontBold,
      color: INK,
    });
    y -= 22;

    const dateLabel = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    page.drawText(
      sanitize(
        `Generated ${dateLabel} - ${cars.length} vehicle${cars.length === 1 ? "" : "s"}`,
      ),
      { x: MARGIN, y, size: 10, font, color: MUTED },
    );
    y -= 12;

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 1,
      color: RULE,
    });
    y -= 24;
  };

  const drawContinuationHeader = () => {
    page.drawText("Fleet Report (continued)", {
      x: MARGIN,
      y,
      size: 11,
      font: fontBold,
      color: MUTED,
    });
    y -= 20;
  };

  drawMainHeader();

  /** Starts a fresh page if the next block won't fit in the remaining space. */
  const ensureSpace = (neededHeight: number) => {
    if (y - neededHeight < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      drawContinuationHeader();
    }
  };

  for (const car of cars) {
    const priceLabel = sanitizeBold(`Ksh ${car.price.toLocaleString()} / day`);
    const nameLine = sanitizeBold(
      car.model ? `${car.name} - ${car.model}` : car.name,
    );
    const description = sanitize(
      car.description?.trim() || "No description provided.",
    );
    const link = sanitize(`${origin}/cars/${car.id}`);

    const descriptionLines = wrapText(
      description,
      font,
      BODY_SIZE,
      CONTENT_WIDTH,
    );

    const blockHeight =
      NAME_SIZE + 6 + descriptionLines.length * LINE_HEIGHT + LINE_HEIGHT + 20;

    ensureSpace(blockHeight);

    // Name / model (left) and price (right, same baseline)
    page.drawText(nameLine, {
      x: MARGIN,
      y,
      size: NAME_SIZE,
      font: fontBold,
      color: INK,
    });
    const priceWidth = fontBold.widthOfTextAtSize(priceLabel, NAME_SIZE);
    page.drawText(priceLabel, {
      x: PAGE_WIDTH - MARGIN - priceWidth,
      y,
      size: NAME_SIZE,
      font: fontBold,
      color: ACCENT,
    });
    y -= NAME_SIZE + 6;

    // Description
    for (const line of descriptionLines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: BODY_SIZE,
        font,
        color: BODY_COLOR,
      });
      y -= LINE_HEIGHT;
    }

    // Link (clickable)
    page.drawText(link, {
      x: MARGIN,
      y,
      size: LINK_SIZE,
      font,
      color: LINK_COLOR,
    });
    const linkWidth = font.widthOfTextAtSize(link, LINK_SIZE);
    addLinkAnnotation(
      pdfDoc,
      page,
      { x: MARGIN, y: y - 2, width: linkWidth, height: LINK_SIZE + 2 },
      link,
    );
    y -= LINE_HEIGHT;

    // Divider between entries
    y -= 4;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: RULE,
    });
    y -= 16;
  }

  return pdfDoc.save();
}
