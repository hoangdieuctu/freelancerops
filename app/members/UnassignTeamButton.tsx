"use client";

import { useRouter } from "next/navigation";
import { unassignMemberFromTeam } from "../actions/members";

export default function UnassignTeamButton({ memberId, teamId, teamName }: { memberId: string; teamId: string; teamName: string }) {
  const router = useRouter();

  async function handleUnassign() {
    if (!confirm(`Remove from team "${teamName}"?`)) return;
    await unassignMemberFromTeam(memberId, teamId);
    router.refresh();
  }

  return (
    <button
      onClick={handleUnassign}
      style={{
        fontSize: "10px",
        color: "var(--text-muted)",
        background: "transparent",
        border: "1px solid var(--border)",
        borderRadius: "3px",
        padding: "2px 6px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      title={`Remove from ${teamName}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--red)";
        e.currentTarget.style.borderColor = "var(--red)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      ×
    </button>
  );
}
