-- One-time migration: backfill NULL idempotencyKey values with unique keys
-- so the @unique constraint in schema.prisma can be applied cleanly.
--
-- PostgreSQL allows multiple NULLs in a unique index, but Prisma's db push
-- warns about potential data loss and refuses without --accept-data-loss.
-- This script assigns a unique key to every row that lacks one.

UPDATE "Job"
SET "idempotencyKey" = "type" || ':backfill_' || "id"
WHERE "idempotencyKey" IS NULL;
