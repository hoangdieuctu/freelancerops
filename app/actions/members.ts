"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getEarningsByProject() {
  const earnings = await prisma.earning.findMany({
    include: { invoice: { include: { project: { include: { customer: true } } } } },
  });
  const map = new Map<string, { name: string; customer: string | null; total: number }>();
  for (const e of earnings) {
    const p = e.invoice.project;
    const existing = map.get(p.id);
    if (existing) {
      existing.total += e.amount;
    } else {
      map.set(p.id, { name: p.name, customer: p.customer?.name ?? null, total: e.amount });
    }
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total);
}

export async function getEarningsByTeam() {
  const earnings = await prisma.earning.findMany({
    include: { invoice: { include: { project: { include: { team: true } } } } },
  });
  const map = new Map<string, { name: string; total: number }>();
  for (const e of earnings) {
    const team = e.invoice.project.team;
    const key = team ? team.id : "__none__";
    const name = team ? team.name : "No team";
    const existing = map.get(key);
    if (existing) {
      existing.total += e.amount;
    } else {
      map.set(key, { name, total: e.amount });
    }
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total);
}

export async function getMemberEarningTotals(): Promise<Record<string, number>> {
  const grouped = await prisma.earning.groupBy({
    by: ["memberId"],
    _sum: { amount: true },
  });
  return Object.fromEntries(grouped.map((g) => [g.memberId, g._sum.amount ?? 0]));
}

export async function getMemberMarginTotals(): Promise<Record<string, number>> {
  const grouped = await prisma.earning.groupBy({
    by: ["memberId"],
    where: { invoiceLineId: null },
    _sum: { amount: true },
  });
  return Object.fromEntries(grouped.map((g) => [g.memberId, g._sum.amount ?? 0]));
}

export async function getProfitMember() {
  return prisma.member.findFirst({ where: { isProfitMember: true } });
}

export async function setProfitMember(id: string) {
  await prisma.member.updateMany({ data: { isProfitMember: false } });
  await prisma.member.update({ where: { id }, data: { isProfitMember: true } });
  revalidatePath("/members");
}

export async function getMembers() {
  return prisma.member.findMany({
    include: { teams: { include: { team: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMember(data: { name: string; role: string; email?: string }) {
  const member = await prisma.member.create({ data });
  revalidatePath("/members");
  return member;
}

export async function updateMember(id: string, data: { name: string; role: string; email?: string }) {
  await prisma.member.update({ where: { id }, data });
  revalidatePath("/members");
}

export async function deleteMember(id: string) {
  await prisma.member.delete({ where: { id } });
  revalidatePath("/members");
}

export async function assignMemberToTeam(memberId: string, teamId: string) {
  await prisma.teamMember.create({ data: { memberId, teamId } });
  revalidatePath("/members");
  revalidatePath(`/teams/${teamId}`);
}

export async function unassignMemberFromTeam(memberId: string, teamId: string) {
  await prisma.teamMember.delete({
    where: { teamId_memberId: { teamId, memberId } },
  });
  revalidatePath("/members");
  revalidatePath(`/teams/${teamId}`);
}
