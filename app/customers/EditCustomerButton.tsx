"use client";

import { useState } from "react";
import { updateCustomer } from "../actions/customers";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function EditCustomerButton({
  customer,
}: {
  customer: { id: string; name: string; email: string | null; address: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await updateCustomer(customer.id, {
      name: fd.get("name") as string,
      email: (fd.get("email") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)} style={{ fontSize: "12px", padding: "4px 12px" }}>
        Edit
      </button>
      {open && (
        <Modal title="Edit Customer" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Name *</label>
                <input name="name" required defaultValue={customer.name} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input name="email" type="email" defaultValue={customer.email ?? ""} placeholder="client@example.com" />
              </div>
              <div>
                <label className="form-label">Address</label>
                <textarea name="address" defaultValue={customer.address ?? ""} rows={3} style={{ resize: "none" }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
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
