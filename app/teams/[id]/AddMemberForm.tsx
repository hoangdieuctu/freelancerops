"use client";

import { useState } from "react";
import { addTeamMember } from "../../actions/teams";
import { useRouter } from "next/navigation";
import Modal from "../../components/Modal";

type Member = { id: string; name: string; role: string };
type TeamMember = { id: string; member: Member };

export default function AddMemberForm({
  teamId,
  availableMembers,
  existingMembers,
}: {
  teamId: string;
  availableMembers: Member[];
  existingMembers: TeamMember[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isShadow, setIsShadow] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const shadowOfId = isShadow ? (fd.get("shadowOfId") as string) : undefined;
    await addTeamMember(fd.get("memberId") as string, teamId, shadowOfId);
    setLoading(false);
    setOpen(false);
    setIsShadow(false);
    router.refresh();
  }

  function handleClose() {
    setOpen(false);
    setIsShadow(false);
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Add Member
      </button>
      {open && (
        <Modal title="Add Member to Team" onClose={handleClose}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {availableMembers.length === 0 ? (
                <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0" }}>
                  All members are already in this team, or no members exist yet.{" "}
                  <a href="/members" style={{ color: "var(--amber)" }}>Manage members →</a>
                </div>
              ) : (
                <>
                  <div>
                    <label className="form-label">Member *</label>
                    <select name="memberId" required>
                      <option value="">Select a member...</option>
                      {availableMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      id="isShadow"
                      checked={isShadow}
                      onChange={(e) => setIsShadow(e.target.checked)}
                      style={{ width: "14px", height: "14px", accentColor: "var(--amber)", cursor: "pointer" }}
                    />
                    <label htmlFor="isShadow" style={{ fontSize: "13px", color: "var(--text-dim)", cursor: "pointer", userSelect: "none" }}>
                      Shadow member (backup for another member)
                    </label>
                  </div>

                  {isShadow && (
                    <div>
                      <label className="form-label">Shadow of *</label>
                      <select name="shadowOfId" required={isShadow}>
                        <option value="">Select member to shadow...</option>
                        {existingMembers.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.member.name} — {tm.member.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={loading || availableMembers.length === 0} style={{ flex: 1 }}>
                {loading ? "Adding..." : "Add to Team"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
