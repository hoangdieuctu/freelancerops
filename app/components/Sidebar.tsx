"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/teams", label: "Teams" },
  { href: "/members", label: "Members" },
  { href: "/customers", label: "Customers" },
  { href: "/projects", label: "Projects" },
  { href: "/invoices", label: "Invoices" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--surface2)",
        borderRight: "1px solid var(--border-bright)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid var(--border-bright)" }}>
        <div
          className="display-font"
          style={{
            fontSize: "24px",
            fontWeight: 800,
            letterSpacing: "0.02em",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          Freelance
          <span style={{ color: "var(--amber)", display: "block" }}>Ops</span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
          Team Management
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        {nav.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                marginBottom: "2px",
                color: isActive ? "var(--amber)" : "var(--text-dim)",
                background: isActive ? "var(--amber-faint)" : "transparent",
                borderLeft: isActive ? "3px solid var(--amber)" : "3px solid transparent",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: isActive ? 600 : 400,
                borderRadius: "0 4px 4px 0",
                transition: "all 0.15s",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-bright)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>v1.0.7</div>
      </div>
    </aside>
  );
}
