export const dynamic = "force-dynamic";

import { getTeams } from "../actions/teams";
import Link from "next/link";
import CreateTeamForm from "./CreateTeamForm";

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em" }}>
            TEAMS
          </div>
          <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "12px" }}>
            {teams.length} team{teams.length !== 1 ? "s" : ""} · {teams.reduce((s, t) => s + t.members.length, 0)} total members
          </div>
        </div>
        <CreateTeamForm />
      </div>

      {teams.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "60px 0", textAlign: "center", border: "1px dashed var(--border)" }}>
          No teams yet. Create your first team above.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px", background: "var(--border)" }}>
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              style={{
                background: "var(--surface)",
                padding: "24px",
                textDecoration: "none",
                display: "block",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div
                  className="display-font"
                  style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "0.03em" }}
                >
                  {team.name}
                </div>
                <span style={{ fontSize: "10px", color: "var(--amber)", letterSpacing: "0.1em" }}>
                  {team.members.length} MEMBER{team.members.length !== 1 ? "S" : ""}
                </span>
              </div>
              {team.description && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.5" }}>
                  {team.description}
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", gap: "16px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--text-dim)" }}>{team.projects.length}</span> project{team.projects.length !== 1 ? "s" : ""}
                </div>
                {team.members.slice(0, 3).map((tm) => (
                  <div key={tm.id} style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tm.member.name}</div>
                ))}
                {team.members.length > 3 && (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>+{team.members.length - 3} more</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
