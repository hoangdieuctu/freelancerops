-- Add type field to Invoice
ALTER TABLE "Invoice" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'normal';

-- CreateTable CustomInvoiceLine
CREATE TABLE "CustomInvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "CustomInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
