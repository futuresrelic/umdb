import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  console.log('\n🔍 === DATABASE SCHEMA CHECK ===\n');

  try {
    // Check if PhysicalCopy table has the new columns
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'PhysicalCopy'
      ORDER BY ordinal_position;
    `;

    console.log('📋 PhysicalCopy Table Columns:');
    console.table(result);

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

    console.log('\n✅ Box Set Columns Status:');
    for (const col of boxSetColumns) {
      const exists = result.some((r) => r.column_name === col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    }

    // Count records
    const physicalCopyCount = await prisma.physicalCopy.count();
    const boxSetCount = await prisma.boxSet.count();
    const boxSetItemCount = await prisma.boxSetItem.count();

    console.log('\n📊 Record Counts:');
    console.log(`  PhysicalCopy: ${physicalCopyCount}`);
    console.log(`  BoxSet: ${boxSetCount}`);
    console.log(`  BoxSetItem: ${boxSetItemCount}`);

    // Check if any PhysicalCopy records have isBoxSet = true
    const boxSetCopies = await prisma.physicalCopy.count({
      where: { isBoxSet: true },
    });
    console.log(`  PhysicalCopy with isBoxSet=true: ${boxSetCopies}`);

    console.log('\n=================================\n');
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
