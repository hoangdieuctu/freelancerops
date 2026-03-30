-- CreateTable
CREATE TABLE "CustomerEmailConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "receivers" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    CONSTRAINT "CustomerEmailConfig_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerEmailConfig_customerId_key" ON "CustomerEmailConfig"("customerId");
