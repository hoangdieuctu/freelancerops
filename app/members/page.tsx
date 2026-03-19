import { getMembers, getMemberEarningTotals } from "../actions/members";
import { getTeams } from "../actions/teams";
import CreateMemberForm from "./CreateMemberForm";
import DeleteMemberButton from "./DeleteMemberButton";
import AssignTeamButton from "./AssignTeamButton";
import UnassignTeamButton from "./UnassignTeamButton";
import ProfitMemberButton from "./ProfitMemberButton";
import Link from "next/link";

export default async function MembersPage() {
  const [members, teams, earningTotals] = await Promise.all([getMembers(), getTeams(), getMemberEarningTotals()]);

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em" }}>
            MEMBERS
          </div>
          <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "12px" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
            {" · "}
            <span style={{ color: "var(--green)" }}>${Object.values(earningTotals).reduce((s, v) => s + v, 0).toFixed(2)} total earned</span>
          </div>
        </div>
        <CreateMemberForm />
      </div>

      {members.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "60px 0", textAlign: "center", border: "1px dashed var(--border)" }}>
          No members yet. Create your first member above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
          {members.map((member) => {
            const assignedTeamIds = new Set(member.teams.map((tm) => tm.teamId));
            const availableTeams = teams.filter((t) => !assignedTeamIds.has(t.id));

            return (
              <div
                key={member.id}
                style={{
                  background: "var(--surface)",
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "24px",
                }}
              >
                {/* Member info */}
                <div style={{ minWidth: "200px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{member.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--amber)", marginTop: "4px", letterSpacing: "0.08em" }}>
                    {member.role.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", fontWeight: 600 }}>
                    ${(earningTotals[member.id] ?? 0).toFixed(2)} earned
                  </div>
                </div>

                {/* Team assignments */}
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                  {member.teams.length === 0 ? (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>No teams assigned</span>
                  ) : (
                    member.teams.map((tm) => (
                      <div
                        key={tm.teamId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          padding: "4px 8px",
                        }}
                      >
                        <Link
                          href={`/teams/${tm.teamId}`}
                          style={{ fontSize: "12px", color: "var(--text-dim)", textDecoration: "none" }}
                        >
                          {tm.team.name}
                        </Link>
                        <UnassignTeamButton memberId={member.id} teamId={tm.teamId} teamName={tm.team.name} />
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <ProfitMemberButton memberId={member.id} isProfitMember={member.isProfitMember} />
                  <AssignTeamButton memberId={member.id} availableTeams={availableTeams} />
                  <DeleteMemberButton memberId={member.id} memberName={member.name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
