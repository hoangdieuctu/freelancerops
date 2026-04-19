export const dynamic = "force-dynamic";

import { getTeams } from "./actions/teams";
import { getCustomers } from "./actions/customers";
import { getProjects } from "./actions/projects";
import { getInvoices } from "./actions/invoices";
import { getMemberEarningTotals, getMemberMarginTotals, getMembers } from "./actions/members";
import Link from "next/link";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [teams, customers, projects, members, earningTotals, marginTotals, invoices] = await Promise.all([
    getTeams(),
    getCustomers(),
    getProjects(),
    getMembers(),
    getMemberEarningTotals(currentYear),
    getMemberMarginTotals(currentYear),
    getInvoices(),
  ]);

  const activeProjects = projects.filter((p) => p.status === "active");
  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const recentProjects = projects.slice(0, 5);
  const totalEarned = Object.values(earningTotals).reduce((s, v) => s + v, 0);
  const totalMargin = Object.values(marginTotals).reduce((s, v) => s + v, 0);
  const unpaidInvoices = invoices.filter((inv) => inv.status !== "paid" && inv.status !== "archived");
  const { unpaidSubtotal, unpaidTotal } = unpaidInvoices.reduce((acc, inv) => {
    const lineSubtotal = inv.type === "custom"
      ? inv.customLines.reduce((ls, l) => ls + l.subtotal, 0)
      : inv.lines.reduce((ls, l) => ls + l.subtotal, 0);
    const taxRate = (inv.taxPercent ?? 0) / 100;
    const total = taxRate > 0 ? lineSubtotal / (1 - taxRate) : lineSubtotal;
    return { unpaidSubtotal: acc.unpaidSubtotal + lineSubtotal, unpaidTotal: acc.unpaidTotal + total };
  }, { unpaidSubtotal: 0, unpaidTotal: 0 });
  const unpaidHasTax = unpaidTotal > unpaidSubtotal;
  const memberEarnings = members
    .map((m) => ({ id: m.id, name: m.name, role: m.role, isProfitMember: m.isProfitMember, total: earningTotals[m.id] ?? 0, margin: marginTotals[m.id] ?? 0 }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1px", background: "var(--border)", marginBottom: "48px" }}>
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
        <Link href="/invoices" style={{ background: "var(--surface)", padding: "28px 24px", textDecoration: "none", display: "block" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "12px" }}>UNPAID</div>
          {unpaidHasTax && (
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "2px" }}>${unpaidSubtotal.toFixed(2)}</div>
          )}
          <div className="display-font" style={{ fontSize: "36px", fontWeight: 800, color: "var(--red)", lineHeight: 1, marginBottom: "6px" }}>
            ${unpaidTotal.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? "s" : ""}</div>
        </Link>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {p._count.invoices > 0 && (
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        {p._count.invoices} inv
                      </span>
                    )}
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Earnings */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div className="display-font" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.03em" }}>EARNINGS {currentYear}</div>
            <Link href="/members" style={{ fontSize: "10px", color: "var(--text-muted)", textDecoration: "none" }}>Members →</Link>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "6px" }}>TOTAL EARNED</div>
            <div className="display-font" style={{ fontSize: "40px", fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>
              ${totalEarned.toFixed(2)}
            </div>
            {totalMargin > 0 && (
              <div style={{ fontSize: "11px", color: "var(--amber)", marginTop: "6px", fontWeight: 600 }}>
                ${totalMargin.toFixed(2)} margin
              </div>
            )}
          </div>
          {memberEarnings.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>No paid invoices yet.</div>
          ) : (
            <div>
              {memberEarnings.map((m, i) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: i < memberEarnings.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: "10px", color: "var(--amber)", marginTop: "2px", letterSpacing: "0.08em" }}>{m.role.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--green)" }}>${m.total.toFixed(2)}</div>
                    {m.isProfitMember && m.margin > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--amber)", fontWeight: 600 }}>${m.margin.toFixed(2)} margin</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
