"use client";

import { useState } from "react";
import { updateInvoice } from "../actions/invoices";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

type TeamMember = {
  id: string;
  clientRate: number | null;
  shadowOfId?: string | null;
  member: { name: string; role: string };
};

type Invoice = {
  id: string;
  number: string;
  invoiceDate: Date;
  dueDate: Date | null;
  notes: string | null;
  taxPercent: number | null;
  status: string;
  lines: {
    id: string;
    teamMemberId: string;
    hoursSpent: number;
    isFixed: boolean;
    description: string | null;
    clientRate: number;
    extraHours: number;
    extraAmount: number;
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
  const initialExtraHours: Record<string, string> = {};
  const initialExtraAmounts: Record<string, string> = {};
  const initialExtraOpen: Record<string, boolean> = {};

  for (const line of invoice.lines) {
    if (line.isFixed) {
      initialModes[line.teamMemberId] = "fixed";
      initialFixedAmounts[line.teamMemberId] = String(line.clientRate);
      if (line.extraAmount > 0) {
        initialExtraAmounts[line.teamMemberId] = String(line.extraAmount);
        initialExtraOpen[line.teamMemberId] = true;
      }
    } else {
      initialModes[line.teamMemberId] = "hourly";
      initialHours[line.teamMemberId] = String(line.hoursSpent);
      if (line.extraHours > 0) {
        initialExtraHours[line.teamMemberId] = String(line.extraHours);
        initialExtraOpen[line.teamMemberId] = true;
      }
    }
    initialDescriptions[line.teamMemberId] = line.description ?? "";
  }

  const [hours, setHours] = useState<Record<string, string>>(initialHours);
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>(initialFixedAmounts);
  const [modes, setModes] = useState<Record<string, "hourly" | "fixed">>(initialModes);
  const [descriptions, setDescriptions] = useState<Record<string, string>>(initialDescriptions);
  const [extraHours, setExtraHours] = useState<Record<string, string>>(initialExtraHours);
  const [extraAmounts, setExtraAmounts] = useState<Record<string, string>>(initialExtraAmounts);
  const [extraOpen, setExtraOpen] = useState<Record<string, boolean>>(initialExtraOpen);
  const [taxPercent, setTaxPercent] = useState(invoice.taxPercent != null ? String(invoice.taxPercent) : "");

  if (invoice.status !== "draft") return null;

  function getMode(tmId: string): "hourly" | "fixed" {
    return modes[tmId] ?? "hourly";
  }

  function getMemberTotal(tm: TeamMember): number {
    if (tm.shadowOfId) return 0;
    if (getMode(tm.id) === "fixed") {
      const base = parseFloat(fixedAmounts[tm.id] ?? "0") || 0;
      const extra = parseFloat(extraAmounts[tm.id] ?? "0") || 0;
      return base + extra;
    }
    const baseH = parseFloat(hours[tm.id] ?? "0") || 0;
    const extraH = parseFloat(extraHours[tm.id] ?? "0") || 0;
    return (baseH + extraH) * (tm.clientRate ?? 0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const lines = members
      .map((tm) => {
        if (tm.shadowOfId) {
          return {
            teamMemberId: tm.id,
            hoursSpent: parseFloat(hours[tm.id] ?? "0") || 0,
            isFixed: false,
            description: descriptions[tm.id] || undefined,
            clientRate: 0,
          };
        }
        if (getMode(tm.id) === "fixed") {
          const amount = parseFloat(fixedAmounts[tm.id] ?? "0") || 0;
          return {
            teamMemberId: tm.id,
            hoursSpent: 1,
            isFixed: true,
            description: descriptions[tm.id] || undefined,
            clientRate: amount,
            extraAmount: parseFloat(extraAmounts[tm.id] ?? "0") || 0,
          };
        }
        return {
          teamMemberId: tm.id,
          hoursSpent: parseFloat(hours[tm.id] ?? "0") || 0,
          isFixed: false,
          description: descriptions[tm.id] || undefined,
          clientRate: tm.clientRate ?? 0,
          extraHours: parseFloat(extraHours[tm.id] ?? "0") || 0,
        };
      })
      .filter((l) => l.hoursSpent > 0 || l.clientRate > 0);

    await updateInvoice(invoice.id, {
      number: fd.get("number") as string,
      invoiceDate: fd.get("invoiceDate") as string,
      dueDate: (fd.get("dueDate") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
      taxPercent: taxPercent ? parseFloat(taxPercent) : undefined,
      lines,
    });

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  const subtotal = members.reduce((sum, tm) => sum + getMemberTotal(tm), 0);
  const taxRate = (parseFloat(taxPercent) || 0) / 100;
  const total = taxRate > 0 ? subtotal / (1 - taxRate) : subtotal;
  const taxAmount = total - subtotal;

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
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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
                      const isExtraOpen = extraOpen[tm.id] ?? false;
                      return (
                        <div key={tm.id} style={{ background: "var(--bg)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "12px", color: "var(--text)" }}>{tm.member.name}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                {tm.member.role}{!tm.shadowOfId && mode === "hourly" && tm.clientRate != null ? ` · $${tm.clientRate.toFixed(2)}/h` : ""}
                                {tm.shadowOfId && <span style={{ color: "var(--amber)", marginLeft: "4px" }}>shadow</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {!tm.shadowOfId && <button type="button" style={toggleStyle(mode === "hourly")} onClick={() => setModes((m) => ({ ...m, [tm.id]: "hourly" }))}>H</button>}
                              {!tm.shadowOfId && <button type="button" style={toggleStyle(mode === "fixed")} onClick={() => setModes((m) => ({ ...m, [tm.id]: "fixed" }))}>$</button>}
                            </div>
                            {(tm.shadowOfId || mode === "hourly") ? (
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
                          {!tm.shadowOfId && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setExtraOpen((o) => ({ ...o, [tm.id]: !o[tm.id] }))}
                                style={{ fontSize: "10px", color: "var(--text-muted)", background: "none", border: "none", padding: "0", cursor: "pointer", textDecoration: "underline" }}
                              >
                                {isExtraOpen ? "− remove extra" : "+ add extra"}
                              </button>
                              {isExtraOpen && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                                  <span style={{ fontSize: "10px", color: "var(--text-muted)", flex: 1 }}>
                                    Extra {mode === "hourly" ? "hours" : "amount"} (client only, counts as margin)
                                  </span>
                                  {mode === "hourly" ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      placeholder="0"
                                      value={extraHours[tm.id] ?? ""}
                                      onChange={(e) => setExtraHours((h) => ({ ...h, [tm.id]: e.target.value }))}
                                      style={{ width: "72px", padding: "4px 8px", fontSize: "13px", textAlign: "right", borderColor: "var(--amber)", opacity: 0.7 }}
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={extraAmounts[tm.id] ?? ""}
                                      onChange={(e) => setExtraAmounts((a) => ({ ...a, [tm.id]: e.target.value }))}
                                      style={{ width: "88px", padding: "4px 8px", fontSize: "13px", textAlign: "right", borderColor: "var(--amber)", opacity: 0.7 }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ borderTop: "2px solid var(--border)", marginTop: "1px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>SUBTOTAL</span>
                      <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 12px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>TAX</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="any"
                            placeholder="0"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(e.target.value)}
                            onBlur={(e) => setTaxPercent(e.target.value ? String(parseFloat(e.target.value)) : "")}
                            style={{ width: "56px", padding: "2px 6px", fontSize: "12px", textAlign: "right" }}
                          />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>%</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>+${taxAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)", marginRight: "12px" }}>TOTAL</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--amber)" }}>${total.toFixed(2)}</span>
                    </div>
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
