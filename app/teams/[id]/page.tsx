export const dynamic = "force-dynamic";

import { getTeam } from "../../actions/teams";
import { getMembers } from "../../actions/members";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddMemberForm from "./AddMemberForm";
import DeleteTeamButton from "./DeleteTeamButton";
import RemoveMemberButton from "./RemoveMemberButton";
import EditTeamButton from "./EditTeamButton";
import RateEditor from "./RateEditor";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [team, allMembers] = await Promise.all([getTeam(id), getMembers()]);
  if (!team) notFound();

  const assignedMemberIds = new Set(team.members.map((tm) => tm.memberId));
  const availableMembers = allMembers.filter((m) => !assignedMemberIds.has(m.id));
  const existingMembers = team.members.map((tm) => ({ id: tm.id, member: tm.member }));

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      {/* Breadcrumb */}
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
        <Link href="/teams" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Teams</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "var(--text-dim)" }}>{team.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "38px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em" }}>
            {team.name.toUpperCase()}
          </div>
          {team.description && (
            <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "12px", maxWidth: "400px" }}>
              {team.description}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <EditTeamButton team={{ id: team.id, name: team.name, description: team.description }} />
          <AddMemberForm teamId={team.id} availableMembers={availableMembers} existingMembers={existingMembers} />
          <DeleteTeamButton teamId={team.id} teamName={team.name} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Members */}
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>
            MEMBERS ({team.members.length})
          </div>
          {team.members.length === 0 ? (
            <div style={{ color: "var(--text-muted)", padding: "24px", border: "1px dashed var(--border)", textAlign: "center", fontSize: "12px" }}>
              No members yet. Add the first one.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
                {team.members.map((tm) => (
                  <div
                    key={tm.id}
                    style={{
                      background: "var(--surface)",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{tm.member.name}</div>
                        {tm.shadowOf && (
                          <span style={{
                            fontSize: "9px",
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            borderRadius: "3px",
                            padding: "2px 6px",
                          }}>
                            SHADOW
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--amber)", marginTop: "4px", letterSpacing: "0.08em" }}>
                        {tm.member.role.toUpperCase()}
                      </div>
                      {tm.shadowOf && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                          Backup for {tm.shadowOf.member.name}
                        </div>
                      )}
                      <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", fontWeight: 600 }}>
                        ${tm.member.earnings.filter(e => e.invoice.project.teamId === team.id).reduce((s, e) => s + e.amount, 0).toFixed(2)} earned
                      </div>
                    </div>
                    <RateEditor
                      teamMemberId={tm.id}
                      teamId={team.id}
                      internalRate={tm.internalRate}
                      clientRate={tm.clientRate}
                      {...(tm.shadowOfId != null ? { shadowOfClientRate: tm.shadowOf?.clientRate ?? null } : {})}
                    />
                    <RemoveMemberButton memberId={tm.memberId} teamId={team.id} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Projects */}
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>
            ASSIGNED PROJECTS ({team.projects.length})
          </div>
          {team.projects.length === 0 ? (
            <div style={{ color: "var(--text-muted)", padding: "24px", border: "1px dashed var(--border)", textAlign: "center", fontSize: "12px" }}>
              No projects assigned yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
              {team.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  style={{
                    background: "var(--surface)",
                    padding: "16px",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{project.name}</div>
                    <span className={`badge badge-${project.status}`}>{project.status}</span>
                  </div>
                  {project.customer && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Client: {project.customer.name}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
