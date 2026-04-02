"use client";

import { useState, useEffect } from "react";
import { createCustomInvoice } from "../actions/invoices";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

type Project = { id: string; name: string; defaultTaxPercent?: number | null };

type Row = {
  description: string;
  isFixed: boolean;
  quantity: string;
  unitPrice: string;
};

function emptyRow(): Row {
  return { description: "", isFixed: false, quantity: "", unitPrice: "" };
}

export default function CreateCustomInvoiceForm({
  projects,
  defaultNumber,
  defaultProjectId,
}: {
  projects: Project[];
  defaultNumber: string;
  defaultProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(defaultNumber);
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId ?? "");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [taxPercent, setTaxPercent] = useState("");
  const router = useRouter();

  // Pre-fill tax from customer default when project is fixed
  useEffect(() => {
    if (open && defaultProjectId) {
      const proj = projects.find((p) => p.id === defaultProjectId);
      if (proj?.defaultTaxPercent != null) {
        setTaxPercent(String(proj.defaultTaxPercent));
      }
    }
  }, [open, defaultProjectId, projects]);

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

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function getRowSubtotal(row: Row): number {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unitPrice) || 0;
    return row.isFixed ? price : qty * price;
  }

  const subtotal = rows.reduce((s, r) => s + getRowSubtotal(r), 0);
  const taxRate = (parseFloat(taxPercent) || 0) / 100;
  const total = taxRate > 0 ? subtotal / (1 - taxRate) : subtotal;
  const taxAmount = total - subtotal;

  function reset() {
    setRows([emptyRow()]);
    setTaxPercent("");
    setSelectedProjectId(defaultProjectId ?? "");
    setInvoiceNumber(defaultNumber);
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validRows = rows.filter((r) => r.description.trim() && (parseFloat(r.unitPrice) || 0) > 0);
    if (validRows.length === 0) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await createCustomInvoice({
      number: invoiceNumber,
      projectId: selectedProjectId,
      invoiceDate: fd.get("invoiceDate") as string,
      dueDate: (fd.get("dueDate") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
      taxPercent: taxPercent ? parseFloat(taxPercent) : undefined,
      lines: validRows.map((r) => ({
        description: r.description.trim(),
        isFixed: r.isFixed,
        quantity: r.isFixed ? 1 : parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unitPrice) || 0,
      })),
    });
    setLoading(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        + Custom Invoice
      </button>
      {open && (
        <Modal title="New Custom Invoice" onClose={handleClose}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
                {/* Left: Invoice details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label">Invoice Number *</label>
                      <input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                        placeholder="INV-001"
                      />
                    </div>
                    <div>
                      <label className="form-label">Invoice Date *</label>
                      <input name="invoiceDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Due Date</label>
                    <input name="dueDate" type="date" />
                  </div>

                  <div>
                    <label className="form-label">Project *</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        const proj = projects.find((p) => p.id === e.target.value);
                        if (proj?.defaultTaxPercent != null) {
                          setTaxPercent(String(proj.defaultTaxPercent));
                        }
                      }}
                      required
                      disabled={!!defaultProjectId}
                    >
                      <option value="">Select a project...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Notes</label>
                    <textarea name="notes" placeholder="Optional notes..." rows={2} style={{ resize: "vertical" }} />
                  </div>
                </div>

                {/* Right: Line items */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label className="form-label">Line Items</label>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
                    {rows.map((row, i) => (
                      <div key={i} style={{ background: "var(--bg)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {/* Row header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", minWidth: "14px" }}>{i + 1}</span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button type="button" style={toggleStyle(!row.isFixed)} onClick={() => updateRow(i, { isFixed: false })}>H</button>
                            <button type="button" style={toggleStyle(row.isFixed)} onClick={() => updateRow(i, { isFixed: true })}>$</button>
                          </div>
                          {!row.isFixed ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="hrs"
                                value={row.quantity}
                                onChange={(e) => updateRow(i, { quantity: e.target.value })}
                                style={{ width: "60px", padding: "4px 8px", fontSize: "12px", textAlign: "right" }}
                              />
                              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>×</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="rate"
                                value={row.unitPrice}
                                onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                                style={{ width: "72px", padding: "4px 8px", fontSize: "12px", textAlign: "right" }}
                              />
                            </>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="amount"
                              value={row.unitPrice}
                              onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                              style={{ width: "88px", padding: "4px 8px", fontSize: "12px", textAlign: "right" }}
                            />
                          )}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", width: "64px", textAlign: "right" }}>
                            ${getRowSubtotal(row).toFixed(2)}
                          </div>
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                              style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "0 2px", lineHeight: 1 }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {/* Description */}
                        <input
                          type="text"
                          placeholder="Description *"
                          value={row.description}
                          onChange={(e) => updateRow(i, { description: e.target.value })}
                          style={{ fontSize: "11px", padding: "4px 8px", color: "var(--text-muted)" }}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRows((rs) => [...rs, emptyRow()])}
                    style={{ fontSize: "11px", color: "var(--amber)", background: "none", border: "1px dashed var(--border)", padding: "6px", cursor: "pointer", textAlign: "center" }}
                  >
                    + Add Row
                  </button>

                  {/* Totals */}
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
                            style={{ width: "88px", padding: "4px 8px", fontSize: "13px", textAlign: "right" }}
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
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !selectedProjectId}
                style={{ flex: 1 }}
              >
                {loading ? "Creating..." : "Create Custom Invoice"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
