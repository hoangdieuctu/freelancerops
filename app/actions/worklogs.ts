"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getWorkLogsByProject(projectId: string) {
  return prisma.workLog.findMany({
    where: { projectId, clearedByInvoiceId: null },
    include: { member: { select: { name: true, role: true } } },
    orderBy: { date: "desc" },
  });
}

export async function addWorkLog(data: {
  projectId: string;
  memberId: string;
  hoursSpent: number;
  description?: string;
  date?: string;
}) {
  await prisma.workLog.create({
    data: {
      projectId: data.projectId,
      memberId: data.memberId,
      hoursSpent: data.hoursSpent,
      description: data.description || null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteWorkLog(id: string, projectId: string) {
  await prisma.workLog.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}

export async function clearWorkLogsByProject(projectId: string, invoiceId: string, createdBefore: Date) {
  await prisma.workLog.updateMany({
    where: { projectId, clearedByInvoiceId: null, createdAt: { lte: createdBefore } },
    data: { clearedByInvoiceId: invoiceId },
  });
}

export async function restoreWorkLogsByInvoice(invoiceId: string, projectId: string) {
  await prisma.workLog.updateMany({
    where: { clearedByInvoiceId: invoiceId },
    data: { clearedByInvoiceId: null },
  });
  revalidatePath(`/projects/${projectId}`);
}
