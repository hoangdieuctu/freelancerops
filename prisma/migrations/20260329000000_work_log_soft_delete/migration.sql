-- AlterTable: add clearedByInvoiceId to WorkLog
ALTER TABLE "WorkLog" ADD COLUMN "clearedByInvoiceId" TEXT REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
