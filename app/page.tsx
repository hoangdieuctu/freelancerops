import { getTeams } from "./actions/teams";
import { getCustomers } from "./actions/customers";
import { getProjects } from "./actions/projects";
import Link from "next/link";

export default async function DashboardPage() {
  const [teams, customers, projects] = await Promise.all([
    getTeams(),
    getCustomers(),
    getProjects(),
  ]);

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const recentProjects = projects.slice(0, 5);

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "48px" }}>
        <div
          className="display-font"
          style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em", color: "var(--text)" }}
        >
          DASHBOARD
        </div>
        <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "12px" }}>
          Overview of your freelance operations
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)", marginBottom: "48px" }}>
        {[
          { label: "TEAMS", value: teams.length, sub: "active", link: "/teams", color: "var(--amber)" },
          { label: "FREELANCERS", value: totalMembers, sub: "total members", link: "/teams", color: "var(--text)" },
          { label: "CUSTOMERS", value: customers.length, sub: "clients", link: "/customers", color: "var(--text)" },
          { label: "PROJECTS", value: projects.length, sub: `${activeProjects.length} active`, link: "/projects", color: "var(--text)" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.link}
            style={{
              background: "var(--surface)",
              padding: "28px 24px",
              textDecoration: "none",
              display: "block",
            }}
          >
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "12px" }}>{stat.label}</div>
            <div
              className="display-font"
              style={{ fontSize: "52px", fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: "6px" }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent projects */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div className="display-font" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.03em" }}>RECENT PROJECTS</div>
            <Link href="/projects" style={{ fontSize: "10px", color: "var(--text-muted)", textDecoration: "none" }}>View all →</Link>
          </div>
          {recentProjects.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", padding: "20px 0" }}>No projects yet.</div>
          ) : (
            <div>
              {recentProjects.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < recentProjects.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--text)", fontSize: "12px", fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {p.customer?.name ?? "No customer"} · {p.team?.name ?? "No team"}
                    </div>
                  </div>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Project status breakdown */}
        <div className="card">
          <div className="display-font" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.03em", marginBottom: "20px" }}>STATUS BREAKDOWN</div>
          {[
            { label: "Active", count: activeProjects.length, color: "var(--green)" },
            { label: "Completed", count: completedProjects.length, color: "var(--blue)" },
            { label: "Paused", count: projects.filter(p => p.status === "paused").length, color: "var(--amber)" },
            { label: "Cancelled", count: projects.filter(p => p.status === "cancelled").length, color: "var(--red)" },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "8px", height: "8px", background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px" }}>{row.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {projects.length > 0 && (
                  <div style={{ width: "80px", height: "4px", background: "var(--border)", position: "relative", overflow: "hidden" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${(row.count / projects.length) * 100}%`,
                        background: row.color,
                      }}
                    />
                  </div>
                )}
                <span className="display-font" style={{ fontSize: "22px", fontWeight: 700, color: row.color, minWidth: "28px", textAlign: "right" }}>
                  {row.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
