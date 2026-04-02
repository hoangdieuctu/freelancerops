"use client";

import { useRouter } from "next/navigation";
import { updateInvoiceStatus, revertInvoiceToSent } from "../actions/invoices";

const STATUSES = ["draft", "sent", "paid"];

export default function InvoiceStatusForm({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === "paid") {
      if (!confirm("Mark this invoice as paid? This will record earnings for all members and cannot be undone.")) {
        e.target.value = currentStatus;
        return;
      }
    }
    await updateInvoiceStatus(invoiceId, newStatus);
    router.refresh();
  }

  async function handleRevert() {
    if (!confirm("Revert to Sent? This will delete all recorded earnings for this invoice.")) return;
    await revertInvoiceToSent(invoiceId);
    router.refresh();
  }

  async function handleArchive() {
    if (!confirm("Archive this invoice? It will be hidden from unpaid totals and dashboards.")) return;
    await updateInvoiceStatus(invoiceId, "archived");
    router.refresh();
  }

  async function handleUnarchive() {
    await updateInvoiceStatus(invoiceId, "draft");
    router.refresh();
  }

  if (currentStatus === "archived") {
    return (
      <button className="btn btn-ghost" style={{ fontSize: "11px", padding: "4px 8px" }} onClick={handleUnarchive}>
        Unarchive
      </button>
    );
  }

  if (currentStatus === "paid") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          fontSize: "12px", padding: "6px 10px", color: "var(--green)",
          border: "1px solid var(--green)", borderRadius: "4px", letterSpacing: "0.05em",
        }}>
          PAID
        </span>
        <button className="btn btn-ghost" style={{ fontSize: "11px", padding: "4px 8px" }} onClick={handleRevert}>
          Revert to Sent
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <select value={currentStatus} onChange={handleChange} style={{ fontSize: "12px", padding: "6px 10px" }}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <button className="btn btn-ghost" style={{ fontSize: "11px", padding: "4px 8px" }} onClick={handleArchive}>
        Archive
      </button>
    </div>
  );
}
