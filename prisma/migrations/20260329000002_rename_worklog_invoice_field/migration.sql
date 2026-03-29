-- Rename clearedByInvoiceId to invoiceId on WorkLog
-- SQLite does not support ALTER COLUMN, so we recreate the table.

PRAGMA foreign_keys=OFF;

CREATE TABLE "WorkLog_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "hoursSpent" REAL NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiceId" TEXT,
    CONSTRAINT "WorkLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "WorkLog_new" ("id", "projectId", "memberId", "hoursSpent", "description", "date", "createdAt", "invoiceId")
SELECT "id", "projectId", "memberId", "hoursSpent", "description", "date", "createdAt", "clearedByInvoiceId"
FROM "WorkLog";

DROP TABLE "WorkLog";
ALTER TABLE "WorkLog_new" RENAME TO "WorkLog";

PRAGMA foreign_keys=ON;
PRAGMA foreign_key_check;
