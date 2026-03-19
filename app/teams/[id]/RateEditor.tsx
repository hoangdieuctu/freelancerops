"use client";

import { useState } from "react";
import { updateTeamMemberRates } from "../../actions/teams";
import { useRouter } from "next/navigation";

export default function RateEditor({
  teamMemberId,
  teamId,
  internalRate,
  clientRate,
  shadowOfClientRate,
}: {
  teamMemberId: string;
  teamId: string;
  internalRate: number | null;
  clientRate: number | null;
  shadowOfClientRate?: number | null;
}) {
  const isShadow = shadowOfClientRate !== undefined;
  const effectiveClientRate = isShadow ? shadowOfClientRate : clientRate;

  const [editing, setEditing] = useState(false);
  const [internal, setInternal] = useState(internalRate?.toString() ?? "");
  const [client, setClient] = useState(clientRate?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    await updateTeamMemberRates(teamMemberId, teamId, {
      internalRate: internal !== "" ? parseFloat(internal) : null,
      clientRate: isShadow ? (shadowOfClientRate ?? null) : (client !== "" ? parseFloat(client) : null),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setInternal(internalRate?.toString() ?? "");
    setClient(clientRate?.toString() ?? "");
    setEditing(false);
  }

  const diff = (effectiveClientRate ?? 0) - (internalRate ?? 0);

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "54px" }}>INTERNAL</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={internal}
              onChange={(e) => setInternal(e.target.value)}
              placeholder="0.00"
              style={{ width: "80px", padding: "3px 6px", fontSize: "12px" }}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "54px" }}>CLIENT</span>
            {isShadow ? (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                {shadowOfClientRate != null ? `$${shadowOfClientRate.toFixed(2)}/h` : "—"} (from shadowed)
              </span>
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="0.00"
                style={{ width: "80px", padding: "3px 6px", fontSize: "12px" }}
              />
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "3px 10px", fontSize: "11px" }}>
            {saving ? "..." : "Save"}
          </button>
          <button className="btn btn-ghost" onClick={handleCancel} style={{ padding: "3px 10px", fontSize: "11px" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "3px", cursor: "pointer", minWidth: "130px" }}
      onClick={() => setEditing(true)}
      title="Click to edit rates"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>INTERNAL</span>
        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
          {internalRate != null ? `$${internalRate.toFixed(2)}/h` : <span style={{ color: "var(--text-muted)" }}>—</span>}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>CLIENT</span>
        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
          {effectiveClientRate != null ? (
            <>{`$${effectiveClientRate.toFixed(2)}/h`}{isShadow && <span style={{ color: "var(--text-muted)", fontSize: "9px", marginLeft: "4px" }}>↑</span>}</>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>—</span>
          )}
        </span>
      </div>
      {internalRate != null && effectiveClientRate != null && (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "3px", marginTop: "1px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>MARGIN</span>
          <span style={{ fontSize: "11px", color: diff >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
            {diff >= 0 ? "+" : ""}${diff.toFixed(2)}/h
          </span>
        </div>
      )}
    </div>
  );
}
