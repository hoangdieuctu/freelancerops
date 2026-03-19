"use client";

import { useRouter } from "next/navigation";
import { setProfitMember } from "../actions/members";

export default function ProfitMemberButton({ memberId, isProfitMember }: { memberId: string; isProfitMember: boolean }) {
  const router = useRouter();

  if (isProfitMember) {
    return (
      <span style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        fontWeight: 700,
        padding: "4px 10px",
        border: "1px solid var(--green)",
        color: "var(--green)",
        borderRadius: "3px",
      }}>
        PROFIT
      </span>
    );
  }

  async function handleClick() {
    if (!confirm("Set this member as the profit receiver? This will unset any previous profit member.")) return;
    await setProfitMember(memberId);
    router.refresh();
  }

  return (
    <button
      className="btn btn-ghost"
      onClick={handleClick}
      style={{ fontSize: "11px" }}
      title="Set as profit member"
    >
      Set profit
    </button>
  );
}
