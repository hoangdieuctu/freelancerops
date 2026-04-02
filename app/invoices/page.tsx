export const dynamic = "force-dynamic";

import { getInvoices, getNextInvoiceNumber } from "../actions/invoices";
import { getProjects } from "../actions/projects";
import CreateInvoiceForm from "./CreateInvoiceForm";
import CreateCustomInvoiceForm from "./CreateCustomInvoiceForm";
import InvoiceList from "./InvoiceList";

export default async function InvoicesPage() {
  const [invoices, projects, nextNumber] = await Promise.all([
    getInvoices(),
    getProjects(),
    getNextInvoiceNumber(),
  ]);

  const formProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    defaultTaxPercent: p.customer?.defaultTaxPercent ?? null,
    team: p.team
      ? {
          members: p.team.members.map((tm) => ({
            id: tm.id,
            clientRate: tm.clientRate,
            shadowOfId: tm.shadowOfId,
            member: { name: tm.member.name, role: tm.member.role },
          })),
        }
      : null,
  }));

  const customFormProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    defaultTaxPercent: p.customer?.defaultTaxPercent ?? null,
  }));

  return (
    <div style={{ padding: "40px 48px" }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
        <div>
          <div className="display-font" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1, letterSpacing: "0.01em" }}>
            INVOICES
          </div>
          <div style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "12px" }}>
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <CreateInvoiceForm projects={formProjects} defaultNumber={nextNumber} />
          <CreateCustomInvoiceForm projects={customFormProjects} defaultNumber={nextNumber} />
        </div>
      </div>

      {invoices.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "60px 0", textAlign: "center", border: "1px dashed var(--border)" }}>
          No invoices yet.
        </div>
      ) : (
        <InvoiceList invoices={invoices} />
      )}
    </div>
  );
}
