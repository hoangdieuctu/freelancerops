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
        <table>
          <thead>
            <tr>
              <th>NAME</th>
              <th>STATUS</th>
              <th>CUSTOMER</th>
              <th>TEAM</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ color: "var(--text)", fontWeight: 500 }}>{p.name}</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td>{p.customer?.name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td>{p.team?.name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                    <EditProjectButton project={p} />
                    <Link
                      href={`/projects/${p.id}`}
                      style={{ fontSize: "12px", color: "var(--amber)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--amber-faint)" }}
                    >
                      Open →
                    </Link>
                    <DeleteProjectButton projectId={p.id} projectName={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
