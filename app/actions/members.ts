"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export async function createMember(data: { name: string; role: string }) {
  const member = await prisma.member.create({ data });
  revalidatePath("/members");
  return member;
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
