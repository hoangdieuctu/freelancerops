"use client";

import { useState } from "react";
import { createCustomer } from "../actions/customers";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function CreateCustomerForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await createCustomer({
      name: fd.get("name") as string,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      defaultTaxPercent: fd.get("defaultTaxPercent") ? parseFloat(fd.get("defaultTaxPercent") as string) : undefined,
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + New Customer
      </button>
      {open && (
        <Modal title="New Customer" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Name *</label>
                <input name="name" required placeholder="Full name" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input name="email" type="email" placeholder="client@example.com" />
              </div>
              <div>
                <label className="form-label">Address</label>
                <textarea name="address" placeholder="Street, city, country..." rows={3} style={{ resize: "none" }} />
              </div>
              <div>
                <label className="form-label">Default Tax (%)</label>
                <input name="defaultTaxPercent" type="number" min="0" max="99" step="any" placeholder="e.g. 10" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Saving..." : "Add Customer"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
