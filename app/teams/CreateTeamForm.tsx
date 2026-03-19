"use client";

import { useState } from "react";
import { createTeam } from "../actions/teams";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function CreateTeamForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await createTeam({
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || undefined,
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + New Team
      </button>
      {open && (
        <Modal title="New Team" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Team Name *</label>
                <input name="name" required placeholder="e.g. Frontend Squad" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea name="description" placeholder="What does this team do?" rows={3} style={{ resize: "none" }} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Creating..." : "Create Team"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
