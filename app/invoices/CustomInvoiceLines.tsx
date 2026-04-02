"use client";

type CustomLine = {
  id: string;
  description: string;
  isFixed: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomInvoiceLines({
  lines,
  taxPercent,
}: {
  lines: CustomLine[];
  taxPercent: number | null;
}) {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const taxRate = (taxPercent ?? 0) / 100;
  const total = taxRate > 0 ? subtotal / (1 - taxRate) : subtotal;
  const taxAmount = total - subtotal;

  const allFixed = lines.every((l) => l.isFixed);

  const colStyle = {
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.05em",
    padding: "8px 0",
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: allFixed ? "2fr 1fr" : "2fr 80px 100px 1fr",
          gap: "12px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "6px",
          marginBottom: "4px",
        }}
      >
        <span style={colStyle}>DESCRIPTION</span>
        {!allFixed && <span style={{ ...colStyle, textAlign: "right" }}>QTY / HRS</span>}
        {!allFixed && <span style={{ ...colStyle, textAlign: "right" }}>UNIT PRICE</span>}
        <span style={{ ...colStyle, textAlign: "right" }}>SUBTOTAL</span>
      </div>

      {/* Rows */}
      {lines.map((line, i) => (
        <div
          key={line.id}
          style={{
            display: "grid",
            gridTemplateColumns: allFixed ? "2fr 1fr" : "2fr 80px 100px 1fr",
            gap: "12px",
            padding: "10px 0",
            borderBottom: "1px solid var(--border)",
            background: i % 2 === 1 ? "var(--surface)" : "transparent",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: "var(--text)" }}>{line.description}</div>
            {!line.isFixed && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {line.quantity}h × {fmt(line.unitPrice)}/h
              </div>
            )}
          </div>
          {!allFixed && (
            <div style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "right" }}>
              {line.isFixed ? "—" : line.quantity}
            </div>
          )}
          {!allFixed && (
            <div style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "right" }}>
              {line.isFixed ? "—" : fmt(line.unitPrice)}
            </div>
          )}
          <div style={{ fontSize: "13px", color: "var(--text)", textAlign: "right", fontWeight: 500 }}>
            {fmt(line.subtotal)}
          </div>
        </div>
      ))}

      {/* Totals */}
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: "48px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>SUBTOTAL</span>
          <span style={{ fontSize: "13px", color: "var(--text-dim)", minWidth: "80px", textAlign: "right" }}>{fmt(subtotal)}</span>
        </div>
        {taxPercent != null && taxPercent > 0 && (
          <div style={{ display: "flex", gap: "48px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>TAX ({taxPercent}%)</span>
            <span style={{ fontSize: "13px", color: "var(--text-dim)", minWidth: "80px", textAlign: "right" }}>{fmt(taxAmount)}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: "48px", borderTop: "2px solid var(--border)", paddingTop: "8px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL</span>
          <span style={{ fontSize: "15px", color: "var(--amber)", fontWeight: 700, minWidth: "80px", textAlign: "right" }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
