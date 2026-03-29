"use client";

import { useState } from "react";
import { addWorkLog, deleteWorkLog } from "../../actions/worklogs";
import { useRouter } from "next/navigation";

type WorkLog = {
  id: string;
  memberId: string;
  hoursSpent: number;
  description: string | null;
  date: Date;
  invoiceId: string | null;
  member: { name: string; role: string };
};

type Member = {
  memberId: string;
  memberName: string;
  memberRole: string;
};

export default function WorkLogPanel({
  projectId,
  members,
  logs,
}: {
  projectId: string;
  members: Member[];
  logs: WorkLog[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.memberId ?? "");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const h = parseFloat(hours);
    if (!selectedMemberId || !h || h <= 0) return;
    setLoading(true);
    await addWorkLog({ projectId, memberId: selectedMemberId, hoursSpent: h, description: description || undefined, date });
    setLoading(false);
    setAdding(false);
    setHours("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteWorkLog(id, projectId);
    setDeletingId(null);
    router.refresh();
  }

  const totalHours = logs.reduce((s, l) => s + l.hoursSpent, 0);

  return (
    <div className="card" style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.03em" }}>
            WORK LOG
          </div>
          {logs.length > 0 && (
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              {totalHours.toFixed(1)}h logged across {logs.length} entr{logs.length === 1 ? "y" : "ies"}
            </div>
          )}
        </div>
        {members.length > 0 && !adding && (
          <button className="btn btn-primary" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={() => setAdding(true)}>
            + Log Work
          </button>
        )}
      </div>

      {members.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
          Assign a team to this project before logging work.
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} style={{ marginBottom: "16px", padding: "14px", background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px", gap: "8px", marginBottom: "8px" }}>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
            >
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>
                  {m.memberName} · {m.memberRole}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.5"
              step="0.5"
              placeholder="hrs"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              style={{ textAlign: "right" }}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "8px" }}>
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: "12px" }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ fontSize: "11px", padding: "6px 14px" }}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)} style={{ fontSize: "11px", padding: "6px 14px" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {logs.length === 0 && !adding && members.length > 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "16px", border: "1px dashed var(--border)", textAlign: "center" }}>
          No work logged yet. These hours will auto-fill when creating an invoice.
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{ background: "var(--surface)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "16px" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", color: "var(--text)" }}>{log.member.name}</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {log.member.role}
                  {log.description && <> · <span style={{ fontStyle: "italic" }}>{log.description}</span></>}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {new Date(log.date).toLocaleDateString()}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--amber)", minWidth: "48px", textAlign: "right" }}>
                {log.hoursSpent}h
              </div>
              {log.invoiceId ? (
                <span style={{ fontSize: "9px", padding: "2px 6px", border: "1px solid var(--border)", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                  INVOICED
                </span>
              ) : (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: "10px", padding: "3px 8px", color: "var(--red)" }}
                  onClick={() => handleDelete(log.id)}
                  disabled={deletingId === log.id}
                >
                  {deletingId === log.id ? "..." : "×"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
