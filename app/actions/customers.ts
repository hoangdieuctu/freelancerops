"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getCustomers() {
  return prisma.customer.findMany({
    include: { projects: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: { projects: { include: { team: true } } },
  });
}

export async function createCustomer(data: {
  name: string;
  email?: string;
  address?: string;
  defaultTaxPercent?: number;
}) {
  const customer = await prisma.customer.create({ data });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, data: { name: string; email?: string; address?: string; defaultTaxPercent?: number }) {
  const customer = await prisma.customer.update({ where: { id }, data });
  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
}

export async function getCustomerEmailConfig(customerId: string) {
  return prisma.customerEmailConfig.findUnique({ where: { customerId } });
}

export async function saveCustomerEmailConfig(
  customerId: string,
  data: { receivers: string; subject: string; bodyHtml: string }
) {
  const config = await prisma.customerEmailConfig.upsert({
    where: { customerId },
    update: data,
    create: { customerId, ...data },
  });
  revalidatePath("/customers");
  return config;
}
