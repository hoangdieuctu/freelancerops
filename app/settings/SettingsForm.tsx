"use client";

import { useState } from "react";
import { saveSettings } from "../actions/settings";
import { sendBackup, restoreBackup } from "../actions/backup";
import { useRouter } from "next/navigation";

type Settings = {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  backupEmail: string | null;
} | null;

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);

  const [smtpHost, setSmtpHost] = useState(settings?.smtpHost ?? "");
  const [smtpPort, setSmtpPort] = useState(String(settings?.smtpPort ?? ""));
  const [smtpUser, setSmtpUser] = useState(settings?.smtpUser ?? "");
  const [smtpPass, setSmtpPass] = useState(settings?.smtpPass ?? "");
  const [backupEmail, setBackupEmail] = useState(settings?.backupEmail ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    await saveSettings({
      smtpHost: smtpHost || undefined,
      smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
      smtpUser: smtpUser || undefined,
      smtpPass: smtpPass || undefined,
      backupEmail: backupEmail || undefined,
    });
    setSaving(false);
    setNotice({ ok: true, msg: "Settings saved." });
    router.refresh();
  }

  async function handleBackup() {
    setBacking(true);
    setNotice(null);
    const result = await sendBackup();
    setBacking(false);
    setNotice(result.ok ? { ok: true, msg: "Backup sent successfully." } : { ok: false, msg: result.error ?? "Unknown error." });
  }

  async function handleRestore() {
    if (!restoreFile) return;
    setRestoring(true);
    setNotice(null);
    const fd = new FormData();
    fd.append("file", restoreFile);
    const result = await restoreBackup(fd);
    setRestoring(false);
    setConfirmRestore(false);
    setRestoreFile(null);
    if (result.ok) {
      setNotice({ ok: true, msg: "Database restored successfully. Reload the page to see updated data." });
    } else {
      setNotice({ ok: false, msg: result.error ?? "Unknown error." });
    }
  }

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* SMTP */}
        <div className="card">
          <div className="display-font" style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "20px" }}>
            SMTP CONFIGURATION
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px" }}>
              <div>
                <label className="form-label">Host</label>
                <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="form-label">Port</label>
                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
              </div>
            </div>
            <div>
              <label className="form-label">Username</label>
              <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="you@gmail.com" autoComplete="off" />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="card">
          <div className="display-font" style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "20px" }}>
            DATABASE BACKUP
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label className="form-label">Send backup to</label>
            <input value={backupEmail} onChange={(e) => setBackupEmail(e.target.value)} placeholder="backup@example.com" type="email" />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBackup}
            disabled={backing}
          >
            {backing ? "Sending backup..." : "Send Backup Now"}
          </button>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            Sends the SQLite database file as an email attachment.
          </div>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: "20px", paddingTop: "20px" }}>
            <div className="display-font" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "12px" }}>
              RESTORE FROM BACKUP
            </div>
            <input
              type="file"
              accept=".db"
              style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px", display: "block" }}
              onChange={(e) => {
                setRestoreFile(e.target.files?.[0] ?? null);
                setConfirmRestore(false);
              }}
            />
            {restoreFile && !confirmRestore && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setConfirmRestore(true)}
              >
                Restore &ldquo;{restoreFile.name}&rdquo;
              </button>
            )}
            {confirmRestore && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--red)" }}>
                  This will overwrite the current database. This cannot be undone.
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" className="btn btn-danger" onClick={handleRestore} disabled={restoring}>
                    {restoring ? "Restoring..." : "Yes, overwrite"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmRestore(false)} disabled={restoring}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              Upload a .db backup file to replace the current database.
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div style={{
          padding: "10px 14px",
          marginTop: "16px",
          marginBottom: "16px",
          fontSize: "12px",
          border: `1px solid ${notice.ok ? "var(--green)" : "var(--red)"}`,
          color: notice.ok ? "var(--green)" : "var(--red)",
        }}>
          {notice.msg}
        </div>
      )}

      <button type="submit" className="btn btn-primary" style={{ marginTop: "8px" }} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
