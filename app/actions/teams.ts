"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getTeams() {
  return prisma.team.findMany({
    include: { members: { include: { member: true, shadowOf: { include: { member: true } } } }, projects: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTeam(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      members: { include: { member: true, shadowOf: { include: { member: true } } } },
      projects: { include: { customer: true } },
    },
  });
}

export async function createTeam(data: { name: string; description?: string }) {
  const team = await prisma.team.create({ data });
  revalidatePath("/teams");
  return team;
}

export async function updateTeam(id: string, data: { name: string; description?: string }) {
  const team = await prisma.team.update({ where: { id }, data });
  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
  return team;
}

export async function deleteTeam(id: string) {
  await prisma.team.delete({ where: { id } });
  revalidatePath("/teams");
}

export async function addTeamMember(memberId: string, teamId: string, shadowOfId?: string) {
  const member = await prisma.teamMember.create({ data: { memberId, teamId, shadowOfId: shadowOfId ?? null } });
  revalidatePath(`/teams/${teamId}`);
  return member;
}

export async function removeTeamMember(memberId: string, teamId: string) {
  await prisma.teamMember.delete({ where: { teamId_memberId: { teamId, memberId } } });
  revalidatePath(`/teams/${teamId}`);
}

export async function updateTeamMemberRates(
  id: string,
  teamId: string,
  data: { internalRate: number | null; clientRate: number | null }
) {
  const tm = await prisma.teamMember.findUnique({
    where: { id },
    include: { shadowOf: true },
  });
  const clientRate = tm?.shadowOf != null ? tm.shadowOf.clientRate : data.clientRate;
  await prisma.teamMember.update({ where: { id }, data: { internalRate: data.internalRate, clientRate } });
  revalidatePath(`/teams/${teamId}`);
}
