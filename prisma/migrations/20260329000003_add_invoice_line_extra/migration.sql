-- Add extraHours and extraAmount to InvoiceLine
ALTER TABLE "InvoiceLine" ADD COLUMN "extraHours" REAL NOT NULL DEFAULT 0;
ALTER TABLE "InvoiceLine" ADD COLUMN "extraAmount" REAL NOT NULL DEFAULT 0;
