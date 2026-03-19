"use client";

import { useState } from "react";
import { updateProject } from "../actions/projects";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function EditProjectButton({
  project,
}: {
  project: { id: string; name: string; description: string | null; status: string };
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await updateProject(project.id, {
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || undefined,
      status: fd.get("status") as string,
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
        <Modal title="Edit Project" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Project Name *</label>
                <input name="name" required defaultValue={project.name} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea name="description" defaultValue={project.description ?? ""} rows={3} style={{ resize: "none" }} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select name="status" defaultValue={project.status}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
