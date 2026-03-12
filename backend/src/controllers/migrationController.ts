import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Run database migration: Add box set fields to PhysicalCopy
 * GET /api/v1/migrate/box-set-fields
 */
export async function migrateBoxSetFields(req: Request, res: Response): Promise<any> {
  try {
    // Check if migration already ran
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'PhysicalCopy'
      AND column_name = 'isBoxSet'
    `);

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Migration already applied',
        already_migrated: true,
      });
    }

    // Run migration
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PhysicalCopy"
        ADD COLUMN "isBoxSet" BOOLEAN DEFAULT false,
        ADD COLUMN "boxSetId" TEXT,
        ADD COLUMN "boxSetPosition" INTEGER
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PhysicalCopy"
        ADD CONSTRAINT "PhysicalCopy_boxSetId_fkey"
        FOREIGN KEY ("boxSetId")
        REFERENCES "BoxSet"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX "PhysicalCopy_boxSetId_idx" ON "PhysicalCopy"("boxSetId")
    `);

    return res.status(200).json({
      status: 'success',
      message: 'Box set fields migration completed successfully',
      changes: [
        'Added isBoxSet column (BOOLEAN)',
        'Added boxSetId column (TEXT)',
        'Added boxSetPosition column (INTEGER)',
        'Added foreign key constraint',
        'Added index on boxSetId',
      ],
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Migration failed',
      error: error.message,
    });
  }
}
