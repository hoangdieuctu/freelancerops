"use client";

import { useState } from "react";
import { updateProject } from "../../actions/projects";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string; members: { id: string }[] };
type Customer = { id: string; name: string; address: string | null };

export default function AssignPanel({
  projectId,
  teams,
  customers,
  currentTeamId,
  currentCustomerId,
}: {
  projectId: string;
  teams: Team[];
  customers: Customer[];
  currentTeamId: string | null;
  currentCustomerId: string | null;
}) {
  const [teamId, setTeamId] = useState(currentTeamId ?? "");
  const [customerId, setCustomerId] = useState(currentCustomerId ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    await updateProject(projectId, {
      teamId: teamId || null,
      customerId: customerId || null,
    });
    setSaving(false);
    router.refresh();
  }

  const changed = teamId !== (currentTeamId ?? "") || customerId !== (currentCustomerId ?? "");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "16px", alignItems: "flex-end" }}>
      <div>
        <label style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
          CUSTOMER
        </label>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">— None —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
          TEAM
        </label>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">— None —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.members.length} members)
            </option>
          ))}
        </select>
      </div>
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving || !changed}
        style={{ opacity: !changed ? 0.4 : 1 }}
      >
        {saving ? "Saving..." : "Save Assignments"}
      </button>
    </div>
  );
}
