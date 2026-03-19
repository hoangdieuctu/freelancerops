"use client";

import { useRouter } from "next/navigation";
import { deleteInvoice } from "../actions/invoices";

export default function DeleteInvoiceButton({ invoiceId, projectId, status }: { invoiceId: string; projectId: string; status: string }) {
  const router = useRouter();

  if (status !== "draft") {
    return (
      <button className="btn btn-danger" disabled title="Only draft invoices can be deleted">
        Delete
      </button>
    );
  }

  async function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await deleteInvoice(invoiceId, projectId);
    router.push("/invoices");
  }

  return (
    <button className="btn btn-danger" onClick={handleDelete}>
      Delete
    </button>
  );
}
