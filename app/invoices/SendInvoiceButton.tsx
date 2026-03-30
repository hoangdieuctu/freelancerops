"use client";

import { useState } from "react";
import { sendInvoice } from "../actions/invoices";
import { useRouter } from "next/navigation";
import Modal from "../components/Modal";

export default function SendInvoiceButton({
  invoiceId,
  hasEmailConfig,
  emailSentAt,
}: {
  invoiceId: string;
  hasEmailConfig: boolean;
  emailSentAt: Date | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handleSend() {
    setError(null);
    setConfirm(false);
    setLoading(true);
    const result = await sendInvoice(invoiceId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Failed to send invoice.");
    } else {
      router.refresh();
    }
  }

  function handleClick() {
    if (emailSentAt) {
      setConfirm(true);
      return;
    }
    handleSend();
  }

  if (!hasEmailConfig) {
    return (
      <div style={{ position: "relative", display: "inline-block" }} className="send-invoice-wrapper">
        <button className="btn btn-ghost" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
          Send
        </button>
        <span className="send-invoice-tooltip">
          No email config for this customer.<br />
          Go to <strong>Customers → Email Config</strong> to set it up.
        </span>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{
          fontSize: "11px",
          color: "var(--red)",
          background: "rgba(192,57,43,0.08)",
          border: "1px solid rgba(192,57,43,0.25)",
          padding: "6px 10px",
          maxWidth: "240px",
          lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleClick}
        disabled={loading}
        style={{ minWidth: "72px" }}
      >
        {loading ? "Sending…" : "Send"}
      </button>

      {confirm && emailSentAt && (
        <Modal title="Resend Invoice?" onClose={() => setConfirm(false)}>
          <div className="modal-body">
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              padding: "8px 0 4px",
              textAlign: "center",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(245,166,35,0.12)",
                border: "1px solid rgba(245,166,35,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                ✉
              </div>
              <div>
                <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600, marginBottom: "6px" }}>
                  This invoice was already sent
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Last sent on{" "}
                  <span style={{ color: "var(--amber)", fontWeight: 500 }}>
                    {new Date(emailSentAt).toLocaleString()}
                  </span>
                  .<br />
                  Do you want to send it again?
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "Sending…" : "Yes, resend"}
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
