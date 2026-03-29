import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";
import { prisma } from "@/lib/prisma";

// ── Helpers ──────────────────────────────────────────────────────────────────

const c = {
  black:   rgb(0.11, 0.11, 0.11),
  gray:    rgb(0.45, 0.45, 0.45),
  lgray:   rgb(0.75, 0.75, 0.75),
  xgray:   rgb(0.95, 0.95, 0.95),
  blue:    rgb(0,    0.44, 0.73),   // #0070ba PayPal blue
  white:   rgb(1,    1,    1),
  divider: rgb(0.88, 0.88, 0.88),
};

const fmt  = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtD = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fonts = { reg: any; bold: any };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function text(page: PDFPage, str: string, x: number, y: number, size: number, font: any, color = c.black) {
  if (!str) return;
  page.drawText(str, { x, y, size, font, color });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function textRight(page: PDFPage, str: string, rightX: number, y: number, size: number, font: any, color = c.black) {
  if (!str) return;
  const w = font.widthOfTextAtSize(str, size);
  page.drawText(str, { x: rightX - w, y, size, font, color });
}

function hline(page: PDFPage, x: number, y: number, w: number, thickness = 0.5, color = c.divider) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness, color });
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [invoice, profitMember] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        project: { include: { customer: true } },
        lines: { include: { teamMember: { include: { member: true } } } },
        workLogs: { orderBy: { date: "asc" } },
      },
    }),
    prisma.member.findFirst({ where: { isProfitMember: true } }),
  ]);
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  // ── Setup ──────────────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const W = 595, H = 842; // A4
  const page = pdfDoc.addPage([W, H]);
  const reg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const f: Fonts = { reg, bold };
  const M = 48; // margin
  const CW = W - M * 2; // content width

  let y = H - M;

  // ── Header bar ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: H - 72, width: W, height: 72, color: c.blue });
  text(page, "INVOICE", M, H - 47, 26, f.bold, c.white);

  // Invoice meta — right side of header
  const metaR = W - M;
  textRight(page, `Invoice #${invoice.number}`, metaR, H - 32, 9, f.reg, c.white);
  textRight(page, `Date: ${fmtD(invoice.invoiceDate)}`, metaR, H - 46, 9, f.reg, c.white);
  if (invoice.dueDate) {
    textRight(page, `Due: ${fmtD(invoice.dueDate)}`, metaR, H - 60, 9, f.reg, c.white);
  }

  y = H - 72 - 28;

  // ── From / Bill To ────────────────────────────────────────────────────────
  const colW = (CW - 20) / 2;
  const fromX = M;
  const toX   = M + colW + 20;

  // Labels
  text(page, "FROM", fromX, y, 8, f.bold, c.blue);
  text(page, "BILL TO", toX, y, 8, f.bold, c.blue);
  y -= 14;

  // From: profit member
  text(page, profitMember?.name ?? "", fromX, y, 10, f.bold);
  y -= 14;
  if (profitMember?.email) {
    text(page, profitMember.email, fromX, y, 9, f.reg, c.gray);
    y -= 13;
  }

  // Bill To: customer — compute max lines for alignment
  const cust = invoice.project.customer;
  const billLines: string[] = [];
  if (cust?.name)    billLines.push(cust.name);
  if (cust?.address) cust.address.split(/[\n,]/).map(s => s.trim()).filter(Boolean).forEach(l => billLines.push(l));
  if (cust?.email)   billLines.push(cust.email);

  // Draw bill-to starting from same y as From name
  let toY = y + 14; // reset to name row
  text(page, billLines[0] ?? "", toX, toY, 10, f.bold);
  toY -= 14;
  for (const l of billLines.slice(1)) {
    text(page, l, toX, toY, 9, f.reg, c.gray);
    toY -= 13;
  }

  // Advance y past both columns
  const fromEndY = y;
  const toEndY   = toY;
  y = Math.min(fromEndY, toEndY) - 20;

  hline(page, M, y, CW);
  y -= 20;

  // ── Table header ──────────────────────────────────────────────────────────
  const col = {
    num:   { x: M,           w: 24  },
    desc:  { x: M + 24,      w: 220 },
    qty:   { x: M + 244,     w: 60  },
    price: { x: M + 304,     w: 90  },
    amt:   { x: M + 394,     w: CW - 394 },
  };

  page.drawRectangle({ x: M, y: y - 18, width: CW, height: 22, color: c.xgray });
  const thY = y - 12;
  text(page, "#",           col.num.x,                          thY, 8, f.bold, c.gray);
  text(page, "DESCRIPTION", col.desc.x,                         thY, 8, f.bold, c.gray);
  text(page, "QTY / HRS",   col.qty.x,                          thY, 8, f.bold, c.gray);
  text(page, "UNIT PRICE",  col.price.x,                        thY, 8, f.bold, c.gray);
  textRight(page, "AMOUNT", M + CW,                             thY, 8, f.bold, c.gray);
  y -= 18 + 8;

  // ── Line items ────────────────────────────────────────────────────────────
  const visibleLines = invoice.lines.filter(l => !l.teamMember.shadowOfId && l.subtotal > 0);
  const allFixed = visibleLines.every(l => l.isFixed);

  // Group invoice work logs by memberId
  const logsByMember = new Map<string, typeof invoice.workLogs>();
  for (const log of invoice.workLogs) {
    const arr = logsByMember.get(log.memberId) ?? [];
    arr.push(log);
    logsByMember.set(log.memberId, arr);
  }

  // Compute dynamic row heights based on work log count
  const rowHeights = visibleLines.map(line => {
    const logs = logsByMember.get(line.teamMember.memberId) ?? [];
    return 28 + logs.length * 13;
  });

  let rowY = y;
  visibleLines.forEach((line, i) => {
    const rowH = rowHeights[i];
    const memberName = line.teamMember.member.name;
    const qty   = line.isFixed ? "—" : String(line.hoursSpent + line.extraHours);
    const price = line.isFixed ? "—" : fmt(line.clientRate);
    const logs  = logsByMember.get(line.teamMember.memberId) ?? [];

    if (i % 2 === 1) {
      page.drawRectangle({ x: M, y: rowY - rowH + 8, width: CW, height: rowH, color: rgb(0.98, 0.98, 0.98) });
    }

    text(page, String(i + 1),  col.num.x,   rowY, 9, f.reg);
    text(page, memberName,      col.desc.x,  rowY, 9, f.bold);

    if (logs.length > 0 && !line.description) {
      logs.forEach((log, j) => {
        const logY = rowY - 11 - j * 13;
        const dateStr = fmtD(log.date);
        const logText = log.description
          ? `• ${dateStr}  ${log.description}  (${log.hoursSpent}h)`
          : `• ${dateStr}  (${log.hoursSpent}h)`;
        text(page, logText, col.desc.x, logY, 7.5, f.reg, c.gray);
      });
    } else {
      const desc = line.description || line.teamMember.member.role;
      if (desc) {
        text(page, desc, col.desc.x, rowY - 11, 8, f.reg, c.gray);
      }
    }

    if (!allFixed) {
      text(page, qty,           col.qty.x,   rowY, 9, f.reg);
      text(page, price,         col.price.x, rowY, 9, f.reg);
    }
    textRight(page, fmt(line.subtotal), M + CW, rowY, 9, f.reg);

    rowY -= rowH;
  });

  y = rowY - 12;

  hline(page, M, y, CW);
  y -= 20;

  // ── Summary ───────────────────────────────────────────────────────────────
  const subtotal = invoice.lines.reduce((s, l) => s + l.subtotal, 0);
  const taxRate = (invoice.taxPercent ?? 0) / 100;
  const total = taxRate > 0 ? subtotal / (1 - taxRate) : subtotal;
  const taxAmount = total - subtotal;
  const sumX  = W - M - 180;
  const sumR  = W - M;

  text(page,      "Subtotal",                        sumX, y, 9, f.reg, c.gray);
  textRight(page, fmt(subtotal),                     sumR, y, 9, f.reg);
  y -= 14;

  if (invoice.taxPercent != null && invoice.taxPercent > 0) {
    text(page,      `Tax (${invoice.taxPercent}%)`,  sumX, y, 9, f.reg, c.gray);
    textRight(page, fmt(taxAmount),                  sumR, y, 9, f.reg);
    y -= 14;
  }

  hline(page, sumX, y, 180, 0.5, c.divider);
  y -= 14;

  // Total row with blue bg
  page.drawRectangle({ x: sumX - 8, y: y - 8, width: 188, height: 26, color: c.blue });
  text(page,      "TOTAL DUE",                       sumX, y + 4, 10, f.bold, c.white);
  textRight(page, `${fmt(total)} USD`,               sumR, y + 4, 10, f.bold, c.white);
  y -= 30;

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    y -= 10;
    hline(page, M, y, CW);
    y -= 18;
    text(page, "Notes", M, y, 9, f.bold, c.gray);
    y -= 14;
    text(page, invoice.notes, M, y, 9, f.reg, c.gray);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: W, height: 28, color: c.xgray });
  text(page, "Thank you for your business.", M, 10, 8, f.reg, c.gray);
  textRight(page, invoice.number, W - M, 10, 8, f.reg, c.lgray);

  // ── Output ────────────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
