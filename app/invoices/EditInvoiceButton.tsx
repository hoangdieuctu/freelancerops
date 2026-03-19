"use client";

import { useState } from "react";
import { updateInvoice } from "../actions/invoices";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

type TeamMember = {
  id: string;
  clientRate: number | null;
  member: { name: string; role: string };
};

type Invoice = {
  id: string;
  number: string;
  invoiceDate: Date;
  dueDate: Date | null;
  notes: string | null;
  status: string;
  lines: {
    id: string;
    teamMemberId: string;
    hoursSpent: number;
    isFixed: boolean;
    description: string | null;
    clientRate: number;
  }[];
  project: {
    team: { members: TeamMember[] } | null;
  };
};

export default function EditInvoiceButton({ invoice }: { invoice: Invoice }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const members = invoice.project.team?.members ?? [];

  const initialHours: Record<string, string> = {};
  const initialFixedAmounts: Record<string, string> = {};
  const initialModes: Record<string, "hourly" | "fixed"> = {};
  const initialDescriptions: Record<string, string> = {};

  for (const line of invoice.lines) {
    if (line.isFixed) {
      initialModes[line.teamMemberId] = "fixed";
      initialFixedAmounts[line.teamMemberId] = String(line.clientRate);
    } else {
      initialModes[line.teamMemberId] = "hourly";
      initialHours[line.teamMemberId] = String(line.hoursSpent);
    }
    initialDescriptions[line.teamMemberId] = line.description ?? "";
  }

  const [hours, setHours] = useState<Record<string, string>>(initialHours);
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>(initialFixedAmounts);
  const [modes, setModes] = useState<Record<string, "hourly" | "fixed">>(initialModes);
  const [descriptions, setDescriptions] = useState<Record<string, string>>(initialDescriptions);

  if (invoice.status !== "draft") return null;

  function getMode(tmId: string): "hourly" | "fixed" {
    return modes[tmId] ?? "hourly";
  }

  function getMemberTotal(tm: TeamMember): number {
    if (getMode(tm.id) === "fixed") {
      return parseFloat(fixedAmounts[tm.id] ?? "0") || 0;
    }
    return (parseFloat(hours[tm.id] ?? "0") || 0) * (tm.clientRate ?? 0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const lines = members
      .map((tm) => {
        if (getMode(tm.id) === "fixed") {
          const amount = parseFloat(fixedAmounts[tm.id] ?? "0") || 0;
          return {
            teamMemberId: tm.id,
            hoursSpent: 1,
            isFixed: true,
            description: descriptions[tm.id] || undefined,
            clientRate: amount,
          };
        }
        return {
          teamMemberId: tm.id,
          hoursSpent: parseFloat(hours[tm.id] ?? "0") || 0,
          isFixed: false,
          description: descriptions[tm.id] || undefined,
          clientRate: tm.clientRate ?? 0,
        };
      })
      .filter((l) => l.hoursSpent > 0 && l.clientRate > 0);

    await updateInvoice(invoice.id, {
      number: fd.get("number") as string,
      invoiceDate: fd.get("invoiceDate") as string,
      dueDate: (fd.get("dueDate") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
      lines,
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const total = members.reduce((sum, tm) => sum + getMemberTotal(tm), 0);

  const toggleStyle = (active: boolean) => ({
    fontSize: "10px",
    padding: "2px 7px",
    border: "1px solid var(--border)",
    background: active ? "var(--amber)" : "transparent",
    color: active ? "var(--bg)" : "var(--text-muted)",
    cursor: "pointer",
    borderRadius: "2px",
    fontWeight: active ? 700 : 400,
  });

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>Edit</button>
      {open && (
        <Modal title="Edit Invoice" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Invoice Number *</label>
                  <input name="number" required defaultValue={invoice.number} placeholder="INV-001" />
                </div>
                <div>
                  <label className="form-label">Invoice Date *</label>
                  <input
                    name="invoiceDate"
                    type="date"
                    required
                    defaultValue={new Date(invoice.invoiceDate).toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : ""}
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  placeholder="Optional notes..."
                  rows={2}
                  style={{ resize: "vertical" }}
                  defaultValue={invoice.notes ?? ""}
                />
              </div>

              {members.length === 0 && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px", border: "1px dashed var(--border)" }}>
                  No team members available.
                </div>
              )}

              {members.length > 0 && (
                <div>
                  <label className="form-label">Amount per Member</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
                    {members.map((tm) => {
                      const mode = getMode(tm.id);
                      return (
                        <div key={tm.id} style={{ background: "var(--bg)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "12px", color: "var(--text)" }}>{tm.member.name}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                {tm.member.role}{mode === "hourly" && tm.clientRate != null ? ` · $${tm.clientRate.toFixed(2)}/h` : ""}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button type="button" style={toggleStyle(mode === "hourly")} onClick={() => setModes((m) => ({ ...m, [tm.id]: "hourly" }))}>H</button>
                              <button type="button" style={toggleStyle(mode === "fixed")} onClick={() => setModes((m) => ({ ...m, [tm.id]: "fixed" }))}>$</button>
                            </div>
                            {mode === "hourly" ? (
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="0"
                                value={hours[tm.id] ?? ""}
                                onChange={(e) => setHours((h) => ({ ...h, [tm.id]: e.target.value }))}
                                style={{ width: "72px", padding: "4px 8px", fontSize: "13px", textAlign: "right" }}
                              />
                            ) : (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={fixedAmounts[tm.id] ?? ""}
                                onChange={(e) => setFixedAmounts((a) => ({ ...a, [tm.id]: e.target.value }))}
                                style={{ width: "88px", padding: "4px 8px", fontSize: "13px", textAlign: "right" }}
                              />
                            )}
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", width: "64px", textAlign: "right" }}>
                              ${getMemberTotal(tm).toFixed(2)}
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Description of work (optional)"
                            value={descriptions[tm.id] ?? ""}
                            onChange={(e) => setDescriptions((d) => ({ ...d, [tm.id]: e.target.value }))}
                            style={{ fontSize: "11px", padding: "4px 8px", color: "var(--text-muted)" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px", borderTop: "2px solid var(--border)", marginTop: "1px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", marginRight: "12px" }}>TOTAL</span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--amber)" }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
