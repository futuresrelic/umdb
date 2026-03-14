import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBoxSetImages() {
  console.log('🔧 Fixing box set images...\n');

  // Find all box sets where spineImageUrl exists but coverImageUrl is null
  const boxSetsToFix = await prisma.boxSet.findMany({
    where: {
      AND: [
        { spineImageUrl: { not: null } },
        { coverImageUrl: null },
      ],
    },
    select: {
      id: true,
      name: true,
      spineImageUrl: true,
      coverImageUrl: true,
    },
  });

  console.log(`Found ${boxSetsToFix.length} box sets to fix\n`);

  for (const boxSet of boxSetsToFix) {
    console.log(`📦 ${boxSet.name}`);
    console.log(`   Moving: ${boxSet.spineImageUrl} → coverImageUrl`);

    await prisma.boxSet.update({
      where: { id: boxSet.id },
      data: {
        coverImageUrl: boxSet.spineImageUrl,
        spineImageUrl: null, // Clear the spine since it was actually the cover
      },
    });

    console.log('   ✅ Fixed\n');
  }

  console.log(`\n✨ Fixed ${boxSetsToFix.length} box sets!`);
}

fixBoxSetImages()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
