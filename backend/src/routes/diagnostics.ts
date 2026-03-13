import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/diagnostics/db-schema
router.get('/db-schema', async (req, res) => {
  try {
    console.log('\n🔍 === DATABASE SCHEMA DIAGNOSTIC ===\n');

    // Check if PhysicalCopy table has the new columns
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'PhysicalCopy'
      ORDER BY ordinal_position;
    `;

    // Check for specific box set columns
    const boxSetColumns = [
      'isBoxSet',
      'boxSetId',
      'boxSetPosition',
      'hasSlipcover',
      'hasBooklet',
      'hasBonusDisc',
      'bonusDiscCount',
      'hasDigitalCopy',
      'has3d',
      'discNumber',
      'discLabel',
    ];

    const columnStatus: Record<string, boolean> = {};
    for (const col of boxSetColumns) {
      columnStatus[col] = columns.some((r) => r.column_name === col);
    }

    // Count records
    const physicalCopyCount = await prisma.physicalCopy.count();
    const boxSetCount = await prisma.boxSet.count();
    const boxSetItemCount = await prisma.boxSetItem.count();

    let boxSetCopiesCount = 0;
    try {
      boxSetCopiesCount = await prisma.physicalCopy.count({
        where: { isBoxSet: true },
      });
    } catch (e) {
      // Column doesn't exist yet
    }

    // Check migration status
    let appliedMigrations: any[] = [];
    try {
      appliedMigrations = await prisma.$queryRaw<any[]>`
        SELECT migration_name, finished_at
        FROM "_prisma_migrations"
        ORDER BY finished_at DESC
        LIMIT 10;
      `;
    } catch (e) {
      // Migration table doesn't exist
    }

    const response = {
      timestamp: new Date().toISOString(),
      columns: {
        total: columns.length,
        list: columns.map((c) => ({ name: c.column_name, type: c.data_type, nullable: c.is_nullable })),
      },
      boxSetColumns: columnStatus,
      allBoxSetColumnsExist: Object.values(columnStatus).every((v) => v),
      counts: {
        physicalCopy: physicalCopyCount,
        boxSet: boxSetCount,
        boxSetItem: boxSetItemCount,
        physicalCopyWithBoxSet: boxSetCopiesCount,
      },
      migrations: {
        applied: appliedMigrations.length,
        latest: appliedMigrations[0] || null,
        recent: appliedMigrations,
      },
    };

    console.log('📊 Diagnostic Result:', JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
