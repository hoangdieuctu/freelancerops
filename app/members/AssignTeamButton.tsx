"use client";

import { useState } from "react";
import { assignMemberToTeam } from "../actions/members";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

type Team = { id: string; name: string };

export default function AssignTeamButton({ memberId, availableTeams }: { memberId: string; availableTeams: Team[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await assignMemberToTeam(memberId, fd.get("teamId") as string);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        className="btn btn-ghost"
        onClick={() => setOpen(true)}
        disabled={availableTeams.length === 0}
        title={availableTeams.length === 0 ? "Already in all teams" : "Assign to team"}
      >
        + Assign Team
      </button>
      {open && (
        <Modal title="Assign to Team" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div>
                <label className="form-label">Team *</label>
                <select name="teamId" required>
                  <option value="">Select a team...</option>
                  {availableTeams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Assigning..." : "Assign"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
