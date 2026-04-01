"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { sendBackup } from "../actions/backup";

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
  const [backing, setBacking] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleBackup() {
    setBacking(true);
    setBackupMsg(null);
    const result = await sendBackup();
    setBacking(false);
    setBackupMsg(result.ok ? { ok: true, msg: "Backup sent!" } : { ok: false, msg: result.error ?? "Failed" });
    setTimeout(() => setBackupMsg(null), 4000);
  }

  return (
    <aside
      style={{
        width: "220px",
        height: "100vh",
        background: "var(--surface2)",
        borderRight: "1px solid var(--border-bright)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
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
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-bright)" }}>
        <button
          onClick={handleBackup}
          disabled={backing}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "8px",
            fontSize: "11px",
            letterSpacing: "0.08em",
            background: "transparent",
            border: "1px solid var(--border)",
            color: backing ? "var(--text-muted)" : "var(--text-dim)",
            cursor: backing ? "not-allowed" : "pointer",
            textAlign: "center",
          }}
        >
          {backing ? "Sending..." : "⬆ Backup DB"}
        </button>
        {backupMsg && (
          <div style={{ fontSize: "10px", color: backupMsg.ok ? "var(--green)" : "var(--red)", marginBottom: "8px", textAlign: "center" }}>
            {backupMsg.msg}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>v1.0.18</div>
          <Link
            href="/settings"
            title="Settings"
            style={{
              color: pathname.startsWith("/settings") ? "var(--amber)" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
}
