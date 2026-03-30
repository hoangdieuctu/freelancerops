import { NextResponse } from "next/server";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { number: true } });
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const pdfBytes = await generateInvoicePdf(id);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.number}.pdf"`,
    },
  });
}
