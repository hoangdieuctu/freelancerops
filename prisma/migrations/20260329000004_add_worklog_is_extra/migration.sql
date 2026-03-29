-- Add isExtra flag to WorkLog for marking hours as extra (margin-only)
ALTER TABLE "WorkLog" ADD COLUMN "isExtra" BOOLEAN NOT NULL DEFAULT false;
