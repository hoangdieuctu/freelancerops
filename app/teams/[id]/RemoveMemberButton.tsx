"use client";

import { useRouter } from "next/navigation";
import { removeTeamMember } from "../../actions/teams";

export default function RemoveMemberButton({ memberId, teamId }: { memberId: string; teamId: string }) {
  const router = useRouter();

  async function handleRemove() {
    if (!confirm("Remove this member from the team?")) return;
    await removeTeamMember(memberId, teamId);
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--text-muted)",
        fontSize: "16px",
        padding: "4px",
        lineHeight: 1,
        transition: "color 0.15s",
      }}
      title="Remove member"
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
    >
      ×
    </button>
  );
}
