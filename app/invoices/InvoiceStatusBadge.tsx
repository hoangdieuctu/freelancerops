"use client";

import { useState } from "react";
import { updateInvoiceStatus } from "../actions/invoices";
import { useRouter } from "next/navigation";

const STATUSES = ["draft", "sent", "paid"];

const statusStyle: Record<string, { color: string; background: string; border: string }> = {
  draft: { color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)" },
  sent:  { color: "var(--amber)",      background: "var(--amber-faint)", border: "1px solid var(--amber)" },
  paid:  { color: "var(--green)",      background: "rgba(0,200,100,0.08)", border: "1px solid var(--green)" },
};

export default function InvoiceStatusBadge({ invoiceId, status }: { invoiceId: string; status: string }) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving || current === "paid") return;
    const next = STATUSES[(STATUSES.indexOf(current) + 1) % STATUSES.length];
    setSaving(true);
    setCurrent(next);
    await updateInvoiceStatus(invoiceId, next);
    setSaving(false);
    router.refresh();
  }

  const s = statusStyle[current] ?? statusStyle.draft;

  return (
    <button
      onClick={handleClick}
      title="Click to change status"
      style={{
        fontSize: "10px",
        letterSpacing: "0.1em",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: "3px",
        cursor: saving ? "wait" : current === "paid" ? "default" : "pointer",
        minWidth: "56px",
        textAlign: "center",
        transition: "all 0.15s",
        ...s,
      }}
    >
      {current.toUpperCase()}
    </button>
  );
}
