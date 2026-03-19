export const dynamic = "force-dynamic";

import { getProjects } from "../actions/projects";
import Link from "next/link";
import CreateProjectForm from "./CreateProjectForm";
import EditProjectButton from "./EditProjectButton";
import DeleteProjectButton from "./[id]/DeleteProjectButton";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em" }}>PROJECTS</div>
          <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "12px" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} · {projects.filter(p => p.status === "active").length} active
          </div>
        </div>
        <CreateProjectForm />
      </div>

      {projects.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "60px 0", textAlign: "center", border: "1px dashed var(--border)" }}>
          No projects yet. Create your first project above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
          <div style={{ background: "var(--bg)", padding: "10px 24px", display: "grid", gridTemplateColumns: "1fr 100px 160px 160px 80px 120px", gap: "16px" }}>
            {["NAME", "STATUS", "CUSTOMER", "TEAM", "INVOICES", ""].map((h) => (
              <div key={h} style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>{h}</div>
            ))}
          </div>
          {projects.map((p) => (
            <div key={p.id} style={{ background: "var(--surface)", display: "grid", gridTemplateColumns: "1fr 100px 160px 160px 80px 120px", gap: "16px", alignItems: "center" }}>
              <Link href={`/projects/${p.id}`} style={{ display: "contents", textDecoration: "none" }}>
                <div style={{ padding: "16px 0 16px 24px", fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{p.name}</div>
                <div style={{ padding: "16px 0" }}><span className={`badge badge-${p.status}`}>{p.status}</span></div>
                <div style={{ padding: "16px 0", fontSize: "12px", color: "var(--text-muted)" }}>{p.customer?.name ?? "—"}</div>
                <div style={{ padding: "16px 0", fontSize: "12px", color: "var(--text-muted)" }}>{p.team?.name ?? "—"}</div>
                <div style={{ padding: "16px 0", fontSize: "12px", color: "var(--text-muted)" }}>{p._count.invoices > 0 ? p._count.invoices : "—"}</div>
              </Link>
              <div style={{ padding: "16px 24px 16px 0", display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <EditProjectButton project={p} />
                <DeleteProjectButton projectId={p.id} projectName={p.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
