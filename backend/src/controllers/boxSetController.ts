import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/box-sets/:id - Get a single box set with all its movies
export async function getBoxSet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const boxSet = await prisma.boxSet.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                year: true,
                posterUrl: true,
                backdropUrl: true,
                tagline: true,
                overview: true,
                rating: true,
                runtime: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!boxSet) {
      res.status(404).json({ error: 'Box set not found' });
      return;
    }

    res.json({ boxSet });
  } catch (err) {
    console.error('Failed to get box set:', err);
    res.status(500).json({ error: 'Failed to get box set' });
  }
}
