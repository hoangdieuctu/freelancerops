"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getProjects() {
  return prisma.project.findMany({
    include: { customer: true, team: { include: { members: { include: { member: true } } } }, _count: { select: { invoices: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      team: { include: { members: { include: { member: true } } } },
      invoices: { include: { lines: true }, orderBy: { invoiceDate: "desc" } },
    },
  });
}

export async function createProject(data: {
  name: string;
  description?: string;
  status?: string;
}) {
  const project = await prisma.project.create({
    data,
  });
  revalidatePath("/projects");
  return project;
}

export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
    status?: string;
    customerId?: string | null;
    teamId?: string | null;
  }
) {
  const project = await prisma.project.update({
    where: { id },
    data,
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return project;
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
}
