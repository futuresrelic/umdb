/**
 * Migration script: mark all existing movies and physical copies as VERIFIED.
 * Run once after deploying the schema update.
 * Usage: npx tsx prisma/migrations/seed-verified-status.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Only verify entries that have no submittedById — these are pre-auth entries
  // that were entered before the user system existed. New pending submissions
  // (which have a submittedById) are left alone.
  const [movies, copies] = await Promise.all([
    prisma.movie.updateMany({
      where: { status: 'PENDING', submittedById: null },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    }),
    prisma.physicalCopy.updateMany({
      where: { status: 'PENDING', submittedById: null },
      data: { status: 'VERIFIED', verifiedAt: new Date() },
    }),
  ]);

  console.log(`Verified ${movies.count} movies and ${copies.count} physical copies.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
