export const dynamic = "force-dynamic";

import { getInvoice } from "../../actions/invoices";
import { getProfitMember } from "../../actions/members";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteInvoiceButton from "../DeleteInvoiceButton";
import InvoiceStatusForm from "../InvoiceStatusForm";
import EditInvoiceButton from "../EditInvoiceButton";

const statusColor: Record<string, string> = {
  draft: "var(--text-muted)",
  sent: "var(--amber)",
  paid: "var(--green)",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, profitMember] = await Promise.all([getInvoice(id), getProfitMember()]);
  if (!invoice) notFound();

  const total = invoice.lines.reduce((s, l) => s + l.subtotal, 0);
  const hourlyLines = invoice.lines.filter(l => !l.isFixed);
  const internalTotal = hourlyLines.reduce((s, l) => s + l.hoursSpent * (l.teamMember.internalRate ?? 0), 0);
  const clientHourlyTotal = hourlyLines.reduce((s, l) => s + l.subtotal, 0);
  const diff = clientHourlyTotal - internalTotal;

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      {/* Breadcrumb */}
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "24px" }}>
        <Link href="/invoices" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Invoices</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span style={{ color: "var(--text-dim)" }}>{invoice.number}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "6px" }}>
            <div className="display-font" style={{ fontSize: "38px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em", color: "var(--amber)" }}>
              {invoice.number}
            </div>
            <span style={{ fontSize: "11px", letterSpacing: "0.1em", color: statusColor[invoice.status] ?? "var(--text-muted)" }}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            <Link href={`/projects/${invoice.project.id}`} style={{ color: "var(--text-dim)", textDecoration: "none" }}>
              {invoice.project.name}
            </Link>
            {invoice.project.customer && (
              <> · {invoice.project.customer.name}</>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            download
            className="btn btn-ghost"
            style={{ textDecoration: "none" }}
          >
            Export PDF
          </a>
          <EditInvoiceButton invoice={{
            id: invoice.id,
            number: invoice.number,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            notes: invoice.notes,
            status: invoice.status,
            lines: invoice.lines.map((l) => ({
              id: l.id,
              teamMemberId: l.teamMemberId,
              hoursSpent: l.hoursSpent,
              isFixed: l.isFixed,
              description: l.description,
              clientRate: l.clientRate,
            })),
            project: {
              team: invoice.project.team
                ? {
                    members: invoice.project.team.members.map((tm) => ({
                      id: tm.id,
                      clientRate: tm.clientRate,
                      member: { name: tm.member.name, role: tm.member.role },
                    })),
                  }
                : null,
            },
          }} />
          <InvoiceStatusForm invoiceId={invoice.id} currentStatus={invoice.status} />
          <DeleteInvoiceButton invoiceId={invoice.id} projectId={invoice.project.id} status={invoice.status} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Meta */}
        <div className="card">
          <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>DETAILS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Invoice Date</span>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Due Date</span>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Project</span>
              <Link href={`/projects/${invoice.project.id}`} style={{ fontSize: "12px", color: "var(--amber)", textDecoration: "none" }}>
                {invoice.project.name}
              </Link>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Customer</span>
              <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>{invoice.project.customer?.name ?? "—"}</span>
            </div>
            {invoice.notes && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: "4px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Notes</div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.5 }}>{invoice.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "8px", textAlign: "center" }}>CLIENT TOTAL</div>
            <div className="display-font" style={{ fontSize: "48px", fontWeight: 800, color: "var(--amber)", lineHeight: 1, textAlign: "center" }}>
              ${total.toFixed(2)}
            </div>
          </div>
          <div style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Internal cost</span>
              <span style={{ fontSize: "13px", color: "var(--text-dim)", fontWeight: 600 }}>${internalTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Margin{profitMember ? <> · <span style={{ color: "var(--green)" }}>{profitMember.name}</span></> : ""}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: diff >= 0 ? "var(--green)" : "var(--red)" }}>
                {diff >= 0 ? "+" : ""}${diff.toFixed(2)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {invoice.lines.length} member{invoice.lines.length !== 1 ? "s" : ""}
            {" · "}
            {invoice.lines.filter(l => !l.isFixed).reduce((s, l) => s + l.hoursSpent, 0).toFixed(1)}h total
          </div>
        </div>
      </div>

      {/* Lines */}
      <div>
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "16px" }}>INVOICE LINES</div>
        <div style={{ background: "var(--border)", display: "flex", flexDirection: "column", gap: "1px" }}>
          {/* Header */}
          <div style={{ background: "var(--bg)", padding: "10px 20px", display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px", gap: "16px" }}>
            {["MEMBER", "CLIENT RATE", "HOURS", "INTERNAL", "SUBTOTAL"].map((h) => (
              <div key={h} style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)", textAlign: h === "MEMBER" ? "left" : "right" }}>{h}</div>
            ))}
          </div>
          {invoice.lines.map((line) => {
            const isFixed = line.isFixed;
            const internalAmount = isFixed
              ? line.subtotal
              : line.hoursSpent * (line.teamMember.internalRate ?? 0);
            return (
            <div
              key={line.id}
              style={{ background: "var(--surface)", padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px", gap: "16px", alignItems: "center" }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{line.teamMember.member.name}</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{line.teamMember.member.role}</div>
                {line.description && (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", fontStyle: "italic" }}>{line.description}</div>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right" }}>
                {isFixed ? "—" : `$${line.clientRate.toFixed(2)}/h`}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right" }}>
                {isFixed ? "—" : `${line.hoursSpent}h`}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right" }}>
                ${internalAmount.toFixed(2)}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600, textAlign: "right" }}>${line.subtotal.toFixed(2)}</div>
            </div>
            );
          })}
          {/* Total row */}
          <div style={{ background: "var(--bg)", padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 100px 100px 100px 100px", gap: "16px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-muted)" }}>TOTAL</div>
            <div />
            <div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "right" }}>
              {invoice.lines.filter(l => !l.isFixed).reduce((s, l) => s + l.hoursSpent, 0).toFixed(1)}h
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)", textAlign: "right" }}>${internalTotal.toFixed(2)}</div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--amber)", textAlign: "right" }}>${total.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
