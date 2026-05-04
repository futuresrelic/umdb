-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('ACTIVE', 'COMING_SOON', 'DEPRECATED');

-- CreateTable
CREATE TABLE "PartnerApp" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "iconUrl" TEXT,
    "installUrl" TEXT,
    "openUrl" TEXT,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" TEXT NOT NULL DEFAULT 'Free',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promoVideoUrl" TEXT,
    "integrationNotes" TEXT,
    "isUmdbIntegrated" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "AppStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnerApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerAppScreenshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartnerAppScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerApp_status_idx" ON "PartnerApp"("status");

-- CreateIndex
CREATE INDEX "PartnerApp_isFeatured_idx" ON "PartnerApp"("isFeatured");

-- CreateIndex
CREATE INDEX "PartnerApp_sortOrder_idx" ON "PartnerApp"("sortOrder");

-- CreateIndex
CREATE INDEX "PartnerAppScreenshot_appId_idx" ON "PartnerAppScreenshot"("appId");

-- CreateIndex
CREATE INDEX "PartnerAppScreenshot_sortOrder_idx" ON "PartnerAppScreenshot"("sortOrder");

-- AddForeignKey
ALTER TABLE "PartnerAppScreenshot" ADD CONSTRAINT "PartnerAppScreenshot_appId_fkey" FOREIGN KEY ("appId") REFERENCES "PartnerApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
