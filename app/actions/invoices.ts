"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

export async function getInvoices() {
  return prisma.invoice.findMany({
    include: {
      project: { include: { customer: true } },
      lines: true,
      customLines: true,
    },
    orderBy: { invoiceDate: "desc" },
  });
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          customer: true,
          team: { include: { members: { include: { member: true } } } },
        },
      },
      lines: { include: { teamMember: { include: { member: true } } } },
      customLines: true,
      workLogs: {
        include: { member: { select: { name: true, role: true } } },
        orderBy: { date: "desc" },
      },
    },
  });
}

export async function getNextInvoiceNumber() {
  const all = await prisma.invoice.findMany({ select: { number: true } });
  const max = all.reduce((highest, inv) => {
    const match = inv.number.match(/(\d+)$/);
    if (!match) return highest;
    return Math.max(highest, parseInt(match[1]));
  }, 0);
  return `INV-${String(max + 1).padStart(3, "0")}`;
}

export async function createInvoice(data: {
  number: string;
  projectId: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  taxPercent?: number;
  lines: { teamMemberId: string; hoursSpent: number; isFixed: boolean; description?: string; clientRate: number; extraHours?: number; extraAmount?: number }[];
}) {
  const invoice = await prisma.invoice.create({
    data: {
      number: data.number,
      projectId: data.projectId,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      taxPercent: data.taxPercent ?? null,
      lines: {
        create: data.lines.map((l) => {
          const extraH = l.extraHours ?? 0;
          const extraA = l.extraAmount ?? 0;
          const subtotal = l.isFixed
            ? l.clientRate + extraA
            : (l.hoursSpent + extraH) * l.clientRate;
          return {
            teamMemberId: l.teamMemberId,
            hoursSpent: l.hoursSpent,
            isFixed: l.isFixed,
            description: l.description || null,
            clientRate: l.clientRate,
            subtotal,
            extraHours: extraH,
            extraAmount: extraA,
          };
        }),
      },
    },
  });

  // Link all free work logs for this project to the new invoice
  await prisma.workLog.updateMany({
    where: { projectId: data.projectId, invoiceId: null },
    data: { invoiceId: invoice.id },
  });

  revalidatePath("/invoices");
  revalidatePath(`/projects/${data.projectId}`);
  return invoice;
}

export async function updateInvoice(
  id: string,
  data: {
    number: string;
    invoiceDate: string;
    dueDate?: string;
    notes?: string;
    taxPercent?: number;
    lines: { teamMemberId: string; hoursSpent: number; isFixed: boolean; description?: string; clientRate: number; extraHours?: number; extraAmount?: number }[];
  }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true, projectId: true } });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status !== "draft") throw new Error("Only draft invoices can be edited.");

  await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      number: data.number,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      taxPercent: data.taxPercent ?? null,
      lines: {
        create: data.lines.map((l) => {
          const extraH = l.extraHours ?? 0;
          const extraA = l.extraAmount ?? 0;
          const subtotal = l.isFixed
            ? l.clientRate + extraA
            : (l.hoursSpent + extraH) * l.clientRate;
          return {
            teamMemberId: l.teamMemberId,
            hoursSpent: l.hoursSpent,
            isFixed: l.isFixed,
            description: l.description || null,
            clientRate: l.clientRate,
            subtotal,
            extraHours: extraH,
            extraAmount: extraA,
          };
        }),
      },
    },
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/projects/${invoice.projectId}`);
  return updated;
}

export async function updateInvoiceStatus(id: string, status: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true, projectId: true, createdAt: true } });
  if (invoice?.status === "paid") throw new Error("Paid invoices cannot be changed.");

  const updated = await prisma.invoice.update({ where: { id }, data: { status } });

  if (status === "paid") {
    const lines = await prisma.invoiceLine.findMany({
      where: { invoiceId: id },
      include: { teamMember: true },
    });

    // For shadowers: subtract shadow hours from their earning
    const hourlyLines = lines.filter(l => !l.isFixed);
    const shadowLines = hourlyLines.filter(l => l.teamMember.shadowOfId);
    const shadowHoursByTarget: Record<string, number> = {};
    for (const sl of shadowLines) {
      const targetId = sl.teamMember.shadowOfId!;
      shadowHoursByTarget[targetId] = (shadowHoursByTarget[targetId] ?? 0) + sl.hoursSpent;
    }

    await prisma.earning.createMany({
      data: lines.map((line) => {
        let amount: number;
        if (line.isFixed) {
          amount = line.subtotal;
        } else if (line.teamMember.shadowOfId) {
          // Shadow member: full hours × internalRate
          amount = line.hoursSpent * (line.teamMember.internalRate ?? 0);
        } else {
          // Shadower: subtract shadow hours
          const effectiveHours = Math.max(0, line.hoursSpent - (shadowHoursByTarget[line.teamMember.id] ?? 0));
          amount = effectiveHours * (line.teamMember.internalRate ?? 0);
        }
        return {
          memberId: line.teamMember.memberId,
          invoiceId: id,
          invoiceLineId: line.id,
          amount,
        };
      }),
    });

    // Margin earning for profit member (hourly lines only)
    const profitMember = await prisma.member.findFirst({ where: { isProfitMember: true } });
    if (profitMember) {
      const clientHourlyTotal = hourlyLines.filter(l => !l.teamMember.shadowOfId).reduce((s, l) => s + l.subtotal, 0);
      const internalTotal = hourlyLines.reduce((s, l) => {
        const effectiveHours = l.teamMember.shadowOfId
          ? l.hoursSpent
          : Math.max(0, l.hoursSpent - (shadowHoursByTarget[l.teamMember.id] ?? 0));
        return s + effectiveHours * (l.teamMember.internalRate ?? 0);
      }, 0);
      const margin = clientHourlyTotal - internalTotal;
      if (margin !== 0) {
        await prisma.earning.create({
          data: { memberId: profitMember.id, invoiceId: id, amount: margin },
        });
      }
    }

  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return updated;
}

export async function revertInvoiceToSent(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true } });
  if (invoice?.status !== "paid") throw new Error("Only paid invoices can be reverted.");
  await prisma.earning.deleteMany({ where: { invoiceId: id } });
  const updated = await prisma.invoice.update({ where: { id }, data: { status: "sent" } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return updated;
}

export async function toggleInvoiceLinePaid(lineId: string, paid: boolean) {
  const line = await prisma.invoiceLine.update({
    where: { id: lineId },
    data: { paidAt: paid ? new Date() : null },
    select: { invoiceId: true },
  });
  revalidatePath(`/invoices/${line.invoiceId}`);
}

export async function deleteInvoice(id: string, projectId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true } });
  if (invoice?.status !== "draft") throw new Error("Only draft invoices can be deleted.");
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  revalidatePath(`/projects/${projectId}`);
}

export async function sendInvoice(id: string): Promise<{ ok: boolean; error?: string }> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          customer: { include: { emailConfig: true } },
        },
      },
      lines: true,
      customLines: true,
    },
  });
  if (!invoice) return { ok: false, error: "Invoice not found." };

  const customer = invoice.project.customer;
  if (!customer?.emailConfig) return { ok: false, error: "No email config for this customer." };

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.smtpHost || !settings?.smtpPort || !settings?.smtpUser || !settings?.smtpPass) {
    return { ok: false, error: "SMTP is not configured. Please fill in all SMTP settings first." };
  }

  const { receivers, subject, bodyHtml } = customer.emailConfig;

  const lineSubtotal = invoice.type === "custom"
    ? invoice.customLines.reduce((s, l) => s + l.subtotal, 0)
    : invoice.lines.reduce((s, l) => s + l.subtotal, 0);
  const taxRate = (invoice.taxPercent ?? 0) / 100;
  const total = taxRate > 0 ? lineSubtotal / (1 - taxRate) : lineSubtotal;
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtD = (d: Date | string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const vars: Record<string, string> = {
    invoiceNumber: invoice.number,
    invoiceDate: fmtD(invoice.invoiceDate),
    dueDate: invoice.dueDate ? fmtD(invoice.dueDate) : "—",
    total: fmt(total),
    customerName: customer.name,
    projectName: invoice.project.name,
  };

  const interpolate = (tpl: string) =>
    tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);

  const resolvedSubject = interpolate(subject);
  const resolvedBody    = interpolate(bodyHtml);

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateInvoicePdf(id);
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpPort === 465,
    auth: { user: settings.smtpUser, pass: settings.smtpPass },
  });

  const toList = receivers.split(",").map((e: string) => e.trim()).filter(Boolean).join(", ");

  try {
    await transporter.sendMail({
      from: settings.smtpFrom || settings.smtpUser,
      to: toList,
      subject: resolvedSubject,
      html: resolvedBody,
      attachments: [
        {
          filename: `invoice-${invoice.number}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  await prisma.invoice.update({ where: { id }, data: { status: "sent", emailSentAt: new Date() } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);

  return { ok: true };
}

export async function createCustomInvoice(data: {
  number: string;
  projectId: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  taxPercent?: number;
  lines: { description: string; isFixed: boolean; quantity: number; unitPrice: number }[];
}) {
  const invoice = await prisma.invoice.create({
    data: {
      number: data.number,
      projectId: data.projectId,
      type: "custom",
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      taxPercent: data.taxPercent ?? null,
      customLines: {
        create: data.lines.map((l) => ({
          description: l.description,
          isFixed: l.isFixed,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          subtotal: l.isFixed ? l.unitPrice : l.quantity * l.unitPrice,
        })),
      },
    },
  });
  revalidatePath("/invoices");
  revalidatePath(`/projects/${data.projectId}`);
  return invoice;
}

export async function updateCustomInvoice(
  id: string,
  data: {
    number: string;
    invoiceDate: string;
    dueDate?: string;
    notes?: string;
    taxPercent?: number;
    lines: { description: string; isFixed: boolean; quantity: number; unitPrice: number }[];
  }
) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true, projectId: true } });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.status !== "draft") throw new Error("Only draft invoices can be edited.");

  await prisma.customInvoiceLine.deleteMany({ where: { invoiceId: id } });
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      number: data.number,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      taxPercent: data.taxPercent ?? null,
      customLines: {
        create: data.lines.map((l) => ({
          description: l.description,
          isFixed: l.isFixed,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          subtotal: l.isFixed ? l.unitPrice : l.quantity * l.unitPrice,
        })),
      },
    },
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/projects/${invoice.projectId}`);
  return updated;
}
