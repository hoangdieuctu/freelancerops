"use client";

import { useRouter } from "next/navigation";
import { deleteMember } from "../actions/members";

export default function DeleteMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete member "${memberName}"? They will be removed from all teams.`)) return;
    await deleteMember(memberId);
    router.refresh();
  }

  return (
    <button className="btn btn-danger" onClick={handleDelete}>
      Delete
    </button>
  );
}
