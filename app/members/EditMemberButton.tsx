"use client";

import { useState } from "react";
import { updateMember } from "../actions/members";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function EditMemberButton({ memberId, name, role, email }: { memberId: string; name: string; role: string; email?: string | null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await updateMember(memberId, {
      name: fd.get("name") as string,
      role: fd.get("role") as string,
      email: (fd.get("email") as string) || undefined,
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>Edit</button>
      {open && (
        <Modal title="Edit Member" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Name *</label>
                <input name="name" required defaultValue={name} placeholder="Full name" />
              </div>
              <div>
                <label className="form-label">Role *</label>
                <input name="role" required defaultValue={role} placeholder="e.g. Developer, Designer..." />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input name="email" type="email" defaultValue={email ?? ""} placeholder="email@example.com" />
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
