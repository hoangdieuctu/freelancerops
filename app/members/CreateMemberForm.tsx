"use client";

import { useState } from "react";
import { createMember } from "../actions/members";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function CreateMemberForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await createMember({
      name: fd.get("name") as string,
      role: fd.get("role") as string,
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + New Member
      </button>
      {open && (
        <Modal title="New Member" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Name *</label>
                <input name="name" required placeholder="Full name" />
              </div>
              <div>
                <label className="form-label">Role *</label>
                <input name="role" required placeholder="e.g. Developer, Designer..." />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Creating..." : "Create Member"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
