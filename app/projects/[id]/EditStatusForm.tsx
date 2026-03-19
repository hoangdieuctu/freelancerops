"use client";

import { useState } from "react";
import { updateProject } from "../../actions/projects";
import { useRouter } from "next/navigation";

const STATUSES = ["active", "paused", "completed", "cancelled"];

export default function EditStatusForm({ projectId, currentStatus }: { projectId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    await updateProject(projectId, { status: newStatus });
    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      style={{ width: "auto", fontSize: "11px", padding: "7px 12px" }}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}
