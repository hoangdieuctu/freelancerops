"use client";

import { useState } from "react";
import { getCustomerEmailConfig, saveCustomerEmailConfig } from "../actions/customers";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

type EmailConfig = {
  receivers: string;
  subject: string;
  bodyHtml: string;
} | null;

export default function EmailConfigButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [config, setConfig] = useState<EmailConfig>(null);
  const router = useRouter();

  async function handleOpen() {
    setFetching(true);
    setOpen(true);
    const existing = await getCustomerEmailConfig(customerId);
    setConfig(
      existing
        ? { receivers: existing.receivers, subject: existing.subject, bodyHtml: existing.bodyHtml }
        : {
            receivers: "",
            subject: "Invoice {{invoiceNumber}} from us",
            bodyHtml: `<p>Hi {{customerName}},</p>\n<p>Please find attached invoice <strong>{{invoiceNumber}}</strong> dated {{invoiceDate}}.</p>\n<p>Amount due: <strong>{{total}}</strong>${""}${""}</p>\n<p>Thank you for your business!</p>`,
          }
    );
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    await saveCustomerEmailConfig(customerId, {
      receivers: fd.get("receivers") as string,
      subject: fd.get("subject") as string,
      bodyHtml: fd.get("bodyHtml") as string,
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        className="btn btn-ghost"
        onClick={handleOpen}
        title="Email config"
        style={{ fontSize: "12px", padding: "4px 12px" }}
      >
        Email Config
      </button>
      {open && (
        <Modal title={`Email Config — ${customerName}`} onClose={() => setOpen(false)}>
          {fetching ? (
            <div className="modal-body" style={{ color: "var(--muted)" }}>Loading…</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Recipients *</label>
                  <input
                    name="receivers"
                    required
                    defaultValue={config?.receivers ?? ""}
                    placeholder="billing@client.com, cfo@client.com"
                  />
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: 4 }}>
                    Comma-separated email addresses
                  </p>
                </div>
                <div>
                  <label className="form-label">Subject *</label>
                  <input
                    name="subject"
                    required
                    defaultValue={config?.subject ?? ""}
                    placeholder="Invoice {{invoiceNumber}} from us"
                  />
                </div>
                <div>
                  <label className="form-label">Body (HTML) *</label>
                  <textarea
                    name="bodyHtml"
                    required
                    defaultValue={config?.bodyHtml ?? ""}
                    rows={10}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px", resize: "vertical" }}
                  />
                  <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: 4 }}>
                    Available variables:{" "}
                    {[
                      "{{invoiceNumber}}",
                      "{{invoiceDate}}",
                      "{{dueDate}}",
                      "{{total}}",
                      "{{customerName}}",
                      "{{projectName}}",
                    ].join("  ")}
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? "Saving..." : "Save Config"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
