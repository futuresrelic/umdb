-- AlterTable
ALTER TABLE "PhysicalCopy" ADD COLUMN     "hasSlipcover" BOOLEAN DEFAULT false,
ADD COLUMN     "hasBooklet" BOOLEAN DEFAULT false,
ADD COLUMN     "hasBonusDisc" BOOLEAN DEFAULT false,
ADD COLUMN     "bonusDiscCount" INTEGER,
ADD COLUMN     "hasDigitalCopy" BOOLEAN DEFAULT false,
ADD COLUMN     "has3d" BOOLEAN DEFAULT false,
ADD COLUMN     "discNumber" INTEGER,
ADD COLUMN     "discLabel" TEXT;
