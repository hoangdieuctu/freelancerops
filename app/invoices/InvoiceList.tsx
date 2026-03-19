"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

type Invoice = {
  id: string;
  number: string;
  status: string;
  invoiceDate: Date;
  dueDate: Date | null;
  lines: { subtotal: number }[];
  project: {
    id: string;
    name: string;
    customer: { id: string; name: string } | null;
  };
};

export default function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const customers = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      if (inv.project.customer) map.set(inv.project.customer.id, inv.project.customer.name);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [invoices]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) map.set(inv.project.id, inv.project.name);
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterCustomer && inv.project.customer?.id !== filterCustomer) return false;
      if (filterProject && inv.project.id !== filterProject) return false;
      if (filterStatus && inv.status !== filterStatus) return false;
      return true;
    });
  }, [invoices, filterCustomer, filterProject, filterStatus]);

  const hasFilters = filterCustomer || filterProject || filterStatus;

  const selectStyle = {
    fontSize: "11px",
    padding: "5px 8px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    borderRadius: "3px",
    width: "120px",
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
        </select>
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={selectStyle}>
          <option value="">All projects</option>
          {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} style={selectStyle}>
          <option value="">All customers</option>
          {customers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        {hasFilters && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: "11px", padding: "5px 10px" }}
            onClick={() => { setFilterCustomer(""); setFilterProject(""); setFilterStatus(""); }}
          >
            Clear
          </button>
        )}
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
          {filtered.length} of {invoices.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: "60px 0", textAlign: "center", border: "1px dashed var(--border)" }}>
          No invoices match the current filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
          {filtered.map((inv) => {
            const total = inv.lines.reduce((s, l) => s + l.subtotal, 0);
            return (
              <div
                key={inv.id}
                style={{ background: "var(--surface)", padding: "20px 24px", display: "flex", alignItems: "center", gap: "24px" }}
              >
                <Link href={`/invoices/${inv.id}`} style={{ minWidth: "100px", textDecoration: "none" }}>
                  <div className="display-font" style={{ fontSize: "14px", fontWeight: 700, color: "var(--amber)" }}>{inv.number}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </div>
                </Link>
                <Link href={`/invoices/${inv.id}`} style={{ flex: 1, textDecoration: "none" }}>
                  <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{inv.project.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {inv.project.customer?.name ?? "No customer"}
                  </div>
                </Link>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {inv.lines.length} line{inv.lines.length !== 1 ? "s" : ""}
                </div>
                {inv.dueDate && (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "80px" }}>
                    Due {new Date(inv.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", minWidth: "80px", textAlign: "right" }}>
                  ${total.toFixed(2)}
                </div>
                <InvoiceStatusBadge invoiceId={inv.id} status={inv.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
