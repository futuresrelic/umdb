-- AlterTable (idempotent - safe to run multiple times)
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "hasSlipcover" BOOLEAN DEFAULT false;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "hasBooklet" BOOLEAN DEFAULT false;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "hasBonusDisc" BOOLEAN DEFAULT false;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "bonusDiscCount" INTEGER;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "hasDigitalCopy" BOOLEAN DEFAULT false;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "has3d" BOOLEAN DEFAULT false;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "discNumber" INTEGER;
ALTER TABLE "PhysicalCopy" ADD COLUMN IF NOT EXISTS "discLabel" TEXT;
