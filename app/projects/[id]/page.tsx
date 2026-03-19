export const dynamic = "force-dynamic";

import { getProject } from "../../actions/projects";
import { getTeams } from "../../actions/teams";
import { getCustomers } from "../../actions/customers";
import { getNextInvoiceNumber } from "../../actions/invoices";
import { notFound } from "next/navigation";
import Link from "next/link";
import AssignPanel from "./AssignPanel";
import DeleteProjectButton from "./DeleteProjectButton";
import EditStatusForm from "./EditStatusForm";
import EditProjectButton from "../EditProjectButton";
import CreateInvoiceForm from "../../invoices/CreateInvoiceForm";

const statusColor: Record<string, string> = {
  draft: "var(--text-muted)",
  sent: "var(--amber)",
  paid: "var(--green)",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, teams, customers, nextNumber] = await Promise.all([
    getProject(id),
    getTeams(),
    getCustomers(),
    getNextInvoiceNumber(),
  ]);
  if (!project) notFound();

  const formProjects = [{
    id: project.id,
    name: project.name,
    team: project.team
      ? {
          members: project.team.members.map((tm) => ({
            id: tm.id,
            clientRate: tm.clientRate,
            member: { name: tm.member.name, role: tm.member.role },
          })),
        }
      : null,
  }];

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      {/* Breadcrumb */}
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
        <Link href="/projects" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Projects</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "var(--text-dim)" }}>{project.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <div className="display-font" style={{ fontSize: "38px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em" }}>
              {project.name.toUpperCase()}
            </div>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          {project.description && (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", maxWidth: "500px" }}>
              {project.description}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <EditStatusForm projectId={project.id} currentStatus={project.status} />
          <EditProjectButton project={project} />
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Current customer */}
        <div className="card">
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>ASSIGNED CUSTOMER</div>
          {project.customer ? (
            <div>
              <div className="display-font" style={{ fontSize: "20px", fontWeight: 700 }}>{project.customer.name}</div>
              {project.customer.email && (
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{project.customer.email}</div>
              )}
              {project.customer.address && (
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{project.customer.address}</div>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>No customer assigned</div>
          )}
        </div>

        {/* Current team */}
        <div className="card">
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>ASSIGNED TEAM</div>
          {project.team ? (
            <div>
              <div className="display-font" style={{ fontSize: "20px", fontWeight: 700 }}>{project.team.name}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                {project.team.members.length} member{project.team.members.length !== 1 ? "s" : ""}
              </div>
              {project.team.members.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {project.team.members.map((tm) => (
                    <span key={tm.id} style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--surface2)", padding: "3px 8px", border: "1px solid var(--border)" }}>
                      {tm.member.name} · {tm.member.role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>No team assigned</div>
          )}
        </div>
      </div>

      {/* Assign panel */}
      <div className="card" style={{ marginBottom: "32px" }}>
        <div className="display-font" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.03em", marginBottom: "24px" }}>
          ASSIGN TEAM & CUSTOMER
        </div>
        <AssignPanel
          projectId={project.id}
          teams={teams}
          customers={customers}
          currentTeamId={project.teamId ?? null}
          currentCustomerId={project.customerId ?? null}
        />
      </div>

      {/* Invoices */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)" }}>
            INVOICES ({project.invoices.length})
          </div>
          <CreateInvoiceForm
            projects={formProjects}
            defaultProjectId={project.id}
            defaultNumber={nextNumber}
          />
        </div>
        {project.invoices.length === 0 ? (
          <div style={{ color: "var(--text-muted)", padding: "24px", border: "1px dashed var(--border)", textAlign: "center", fontSize: "12px" }}>
            No invoices yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
            {project.invoices.map((inv) => {
              const total = inv.lines.reduce((s, l) => s + l.subtotal, 0);
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  style={{ background: "var(--surface)", padding: "16px 20px", textDecoration: "none", display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <div className="display-font" style={{ fontSize: "13px", fontWeight: 700, color: "var(--amber)", minWidth: "90px" }}>{inv.number}</div>
                  <div style={{ flex: 1, fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                    {inv.dueDate && <> · Due {new Date(inv.dueDate).toLocaleDateString()}</>}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{inv.lines.length} line{inv.lines.length !== 1 ? "s" : ""}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>${total.toFixed(2)}</div>
                  <span style={{ fontSize: "10px", letterSpacing: "0.1em", color: statusColor[inv.status] ?? "var(--text-muted)", minWidth: "36px", textAlign: "right" }}>
                    {inv.status.toUpperCase()}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
