"use client";

import { useRouter } from "next/navigation";
import { deleteCustomer } from "../actions/customers";

export default function DeleteCustomerButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete customer "${customerName}"?`)) return;
    await deleteCustomer(customerId);
    router.refresh();
  }

  return (
    <button className="btn btn-danger" onClick={handleDelete} style={{ fontSize: "10px", padding: "4px 10px" }}>
      Delete
    </button>
  );
}
