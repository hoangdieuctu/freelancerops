"use client";

import { useRouter } from "next/navigation";
import { deleteTeam } from "../../actions/teams";

export default function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete team "${teamName}"? This will also remove all members.`)) return;
    await deleteTeam(teamId);
    router.push("/teams");
  }

  return (
    <button className="btn btn-danger" onClick={handleDelete}>
      Delete
    </button>
  );
}
