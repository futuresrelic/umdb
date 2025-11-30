import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

export const getAllPeople = asyncHandler(async (req: Request, res: Response) => {
  const { search, limit = 50, offset = 0 } = req.query;

  const where: any = {};

  if (search) {
    where.name = { contains: String(search), mode: 'insensitive' };
  }

  const [people, total] = await Promise.all([
    prisma.person.findMany({
      where,
      include: {
        moviePeople: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                year: true,
                posterUrl: true,
                rating: true
              }
            }
          },
          take: 10
        }
      },
      orderBy: { name: 'asc' },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset))
    }),
    prisma.person.count({ where })
  ]);

  res.json({
    people,
    total,
    limit: parseInt(String(limit)),
    offset: parseInt(String(offset))
  });
});

export const getPersonById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      moviePeople: {
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              year: true,
              posterUrl: true,
              rating: true
            }
          }
        },
        orderBy: {
          movie: {
            year: 'desc'
          }
        }
      }
    }
  });

  if (!person) {
    throw new AppError('Person not found', 404);
  }

  res.json(person);
});

export const createPerson = asyncHandler(async (req: Request, res: Response) => {
  const { name, birthDate, deathDate, biography, photoUrl, tmdbId, imdbId } = req.body;

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  const person = await prisma.person.create({
    data: {
      name,
      birthDate: birthDate ? new Date(birthDate) : null,
      deathDate: deathDate ? new Date(deathDate) : null,
      biography,
      photoUrl,
      tmdbId: tmdbId ? parseInt(tmdbId) : null,
      imdbId
    }
  });

  res.status(201).json(person);
});

export const updatePerson = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Convert date fields
  if (updateData.birthDate) updateData.birthDate = new Date(updateData.birthDate);
  if (updateData.deathDate) updateData.deathDate = new Date(updateData.deathDate);
  if (updateData.tmdbId) updateData.tmdbId = parseInt(updateData.tmdbId);

  const person = await prisma.person.update({
    where: { id },
    data: updateData
  });

  res.json(person);
});

export const deletePerson = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.person.delete({
    where: { id }
  });

  res.status(204).send();
});
