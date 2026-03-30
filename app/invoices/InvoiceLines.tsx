"use client";

import { useState, useTransition } from "react";
import { toggleInvoiceLinePaid } from "../actions/invoices";

type Line = {
  id: string;
  isFixed: boolean;
  hoursSpent: number;
  extraHours: number;
  extraAmount: number;
  clientRate: number;
  subtotal: number;
  description: string | null;
  paidAt: Date | null;
  teamMember: {
    id: string;
    internalRate: number | null;
    shadowOfId: string | null;
    member: { name: string; role: string };
  };
};

export default function InvoiceLines({
  lines,
  internalTotal,
  subtotal,
  taxPercent,
  taxAmount,
  total,
}: {
  lines: Line[];
  internalTotal: number;
  subtotal: number;
  taxPercent: number | null;
  taxAmount: number;
  total: number;
}) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  function isPaid(line: Line) {
    return optimistic[line.id] !== undefined ? optimistic[line.id] : !!line.paidAt;
  }

  function toggle(line: Line) {
    const next = !isPaid(line);
    setOptimistic((o) => ({ ...o, [line.id]: next }));
    startTransition(async () => {
      await toggleInvoiceLinePaid(line.id, next);
    });
  }

  return (
    <div style={{ background: "var(--border)", display: "flex", flexDirection: "column", gap: "1px" }}>
      {/* Header */}
      <div style={{ background: "var(--bg)", padding: "10px 20px", display: "grid", gridTemplateColumns: "28px 1fr 100px 100px 100px 100px", gap: "16px" }}>
        <div />
        {["MEMBER", "CLIENT RATE", "HOURS", "INTERNAL", "SUBTOTAL"].map((h) => (
          <div key={h} style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)", textAlign: h === "MEMBER" ? "left" : "right" }}>{h}</div>
        ))}
      </div>

      {lines.map((line) => {
        const paid = isPaid(line);
        const internalAmount = line.isFixed
          ? line.subtotal
          : line.hoursSpent * (line.teamMember.internalRate ?? 0);

        return (
          <div
            key={line.id}
            style={{
              background: paid ? "rgba(74,222,128,0.04)" : "var(--surface)",
              padding: "14px 20px",
              display: "grid",
              gridTemplateColumns: "28px 1fr 100px 100px 100px 100px",
              gap: "16px",
              alignItems: "center",
              transition: "background 0.2s",
            }}
          >
            {/* Checkbox */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button
                onClick={() => toggle(line)}
                aria-label={paid ? "Mark unpaid" : "Mark paid"}
                style={{
                  width: "18px",
                  height: "18px",
                  border: `1.5px solid ${paid ? "var(--green)" : "var(--border)"}`,
                  background: paid ? "var(--green)" : "transparent",
                  borderRadius: "3px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                  padding: 0,
                }}
              >
                {paid && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#0c0c0c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>

            {/* Member */}
            <div style={{ opacity: paid ? 0.45 : 1, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{line.teamMember.member.name}</span>
                {line.teamMember.shadowOfId && (
                  <span style={{ fontSize: "9px", padding: "1px 6px", border: "1px solid var(--amber)", color: "var(--amber)", letterSpacing: "0.08em" }}>SHADOW</span>
                )}
                {paid && (
                  <span style={{ fontSize: "9px", padding: "1px 6px", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--green)", letterSpacing: "0.08em" }}>PAID</span>
                )}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{line.teamMember.member.role}</div>
              {line.description && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontStyle: "italic" }}>{line.description}</div>
              )}
            </div>

            {/* Client rate */}
            <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right", opacity: paid ? 0.45 : 1 }}>
              {line.isFixed ? "—" : `$${line.clientRate.toFixed(2)}/h`}
            </div>

            {/* Hours */}
            <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right", opacity: paid ? 0.45 : 1 }}>
              {line.isFixed ? "—" : `${line.hoursSpent + line.extraHours}h`}
              {!line.isFixed && line.extraHours > 0 && (
                <div style={{ fontSize: "9px", color: "var(--amber)", marginTop: "2px" }}>+{line.extraHours}h extra</div>
              )}
              {line.isFixed && line.extraAmount > 0 && (
                <div style={{ fontSize: "9px", color: "var(--amber)", marginTop: "2px" }}>+${line.extraAmount.toFixed(2)} extra</div>
              )}
            </div>

            {/* Internal */}
            <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right", opacity: paid ? 0.45 : 1 }}>
              ${internalAmount.toFixed(2)}
            </div>

            {/* Subtotal */}
            <div style={{ fontSize: "13px", fontWeight: 600, textAlign: "right", color: paid ? "var(--green)" : "var(--text)", transition: "color 0.2s" }}>
              ${line.subtotal.toFixed(2)}
            </div>
          </div>
        );
      })}

      {/* Subtotal row */}
      <div style={{ background: "var(--bg)", padding: "14px 20px", display: "grid", gridTemplateColumns: "28px 1fr 100px 100px 100px 100px", gap: "16px" }}>
        <div />
        <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>SUBTOTAL</div>
        <div />
        <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right" }}>
          {lines.filter(l => !l.isFixed && !l.teamMember.shadowOfId).reduce((s, l) => s + l.hoursSpent + l.extraHours, 0).toFixed(1)}h
        </div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)", textAlign: "right" }}>${internalTotal.toFixed(2)}</div>
        <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-dim)", textAlign: "right" }}>${subtotal.toFixed(2)}</div>
      </div>

      {taxPercent != null && taxPercent > 0 && (
        <div style={{ background: "var(--bg)", padding: "8px 20px", display: "grid", gridTemplateColumns: "28px 1fr 100px 100px 100px 100px", gap: "16px", borderTop: "1px solid var(--border)" }}>
          <div />
          <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>TAX ({taxPercent}%)</div>
          <div /><div /><div />
          <div style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "right" }}>+${taxAmount.toFixed(2)}</div>
        </div>
      )}

      <div style={{ background: "var(--bg)", padding: "14px 20px", display: "grid", gridTemplateColumns: "28px 1fr 100px 100px 100px 100px", gap: "16px", borderTop: "2px solid var(--border)" }}>
        <div />
        <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>TOTAL</div>
        <div /><div /><div />
        <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--amber)", textAlign: "right" }}>${total.toFixed(2)}</div>
      </div>
    </div>
  );
}
