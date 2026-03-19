"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getInvoices() {
  return prisma.invoice.findMany({
    include: {
      project: { include: { customer: true } },
      lines: true,
    },
    orderBy: { createdAt: "desc" },
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
    },
  });
}

export async function getNextInvoiceNumber() {
  const last = await prisma.invoice.findFirst({ orderBy: { createdAt: "desc" } });
  if (!last) return "INV-001";
  const match = last.number.match(/(\d+)$/);
  if (!match) return "INV-001";
  const next = parseInt(match[1]) + 1;
  return `INV-${String(next).padStart(3, "0")}`;
}

export async function createInvoice(data: {
  number: string;
  projectId: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  lines: { teamMemberId: string; hoursSpent: number; description?: string; clientRate: number }[];
}) {
  const invoice = await prisma.invoice.create({
    data: {
      number: data.number,
      projectId: data.projectId,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      lines: {
        create: data.lines.map((l) => ({
          teamMemberId: l.teamMemberId,
          hoursSpent: l.hoursSpent,
          description: l.description || null,
          clientRate: l.clientRate,
          subtotal: l.hoursSpent * l.clientRate,
        })),
      },
    },
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
    lines: { teamMemberId: string; hoursSpent: number; description?: string; clientRate: number }[];
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
      lines: {
        create: data.lines.map((l) => ({
          teamMemberId: l.teamMemberId,
          hoursSpent: l.hoursSpent,
          description: l.description || null,
          clientRate: l.clientRate,
          subtotal: l.hoursSpent * l.clientRate,
        })),
      },
    },
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/projects/${invoice.projectId}`);
  return updated;
}

export async function updateInvoiceStatus(id: string, status: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true } });
  if (invoice?.status === "paid") throw new Error("Paid invoices cannot be changed.");
  const updated = await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return updated;
}

export async function deleteInvoice(id: string, projectId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { status: true } });
  if (invoice?.status !== "draft") throw new Error("Only draft invoices can be deleted.");
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  revalidatePath(`/projects/${projectId}`);
}
