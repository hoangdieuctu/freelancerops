"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getWorkLogsByProject(projectId: string) {
  return prisma.workLog.findMany({
    where: { projectId, invoiceId: null },
    include: { member: { select: { name: true, role: true } } },
    orderBy: { date: "desc" },
  });
}

export async function getWorkLogsByInvoice(invoiceId: string) {
  return prisma.workLog.findMany({
    where: { invoiceId },
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
  const log = await prisma.workLog.findUnique({ where: { id }, select: { invoiceId: true } });
  if (log?.invoiceId) throw new Error("Cannot delete a work log that is linked to an invoice.");
  await prisma.workLog.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}
