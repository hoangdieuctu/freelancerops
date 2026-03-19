"use client";

import { useRouter } from "next/navigation";
import { updateInvoiceStatus } from "../actions/invoices";

const STATUSES = ["draft", "sent", "paid"];

export default function InvoiceStatusForm({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateInvoiceStatus(invoiceId, e.target.value);
    router.refresh();
  }

  if (currentStatus === "paid") {
    return (
      <span style={{
        fontSize: "12px", padding: "6px 10px", color: "var(--green)",
        border: "1px solid var(--green)", borderRadius: "4px", letterSpacing: "0.05em",
      }}>
        PAID
      </span>
    );
  }

  return (
    <select value={currentStatus} onChange={handleChange} style={{ fontSize: "12px", padding: "6px 10px" }}>
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}
