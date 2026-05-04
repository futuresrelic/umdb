import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppStatus } from '@prisma/client';

// GET /api/partner-apps - Get all partner apps (public)
export async function getAllPartnerApps(req: Request, res: Response): Promise<void> {
  try {
    const { status = 'ACTIVE', featured } = req.query;

    const where: any = {};
    if (status) {
      where.status = status as AppStatus;
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const apps = await prisma.partnerApp.findMany({
      where,
      include: {
        screenshots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json({ apps });
  } catch (err) {
    console.error('Failed to fetch partner apps:', err);
    res.status(500).json({ error: 'Failed to fetch partner apps' });
  }
}

// GET /api/partner-apps/:id - Get single partner app
export async function getPartnerApp(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const app = await prisma.partnerApp.findUnique({
      where: { id },
      include: {
        screenshots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!app) {
      res.status(404).json({ error: 'Partner app not found' });
      return;
    }

    res.json(app);
  } catch (err) {
    console.error('Failed to fetch partner app:', err);
    res.status(500).json({ error: 'Failed to fetch partner app' });
  }
}

// POST /api/admin/partner-apps - Create partner app (admin only)
export async function createPartnerApp(req: Request, res: Response): Promise<void> {
  try {
    const {
      id,
      name,
      tagline,
      description,
      iconUrl,
      installUrl,
      openUrl,
      platforms,
      price,
      features,
      promoVideoUrl,
      integrationNotes,
      isUmdbIntegrated,
      isFeatured,
      status,
      sortOrder,
      screenshots,
    } = req.body;

    if (!id || !name) {
      res.status(400).json({ error: 'ID and name are required' });
      return;
    }

    // Check if app with this ID already exists
    const existing = await prisma.partnerApp.findUnique({
      where: { id },
    });

    if (existing) {
      res.status(409).json({ error: 'Partner app with this ID already exists' });
      return;
    }

    const app = await prisma.partnerApp.create({
      data: {
        id,
        name,
        tagline: tagline || null,
        description: description || null,
        iconUrl: iconUrl || null,
        installUrl: installUrl || null,
        openUrl: openUrl || null,
        platforms: platforms || [],
        price: price || 'Free',
        features: features || [],
        promoVideoUrl: promoVideoUrl || null,
        integrationNotes: integrationNotes || null,
        isUmdbIntegrated: isUmdbIntegrated || false,
        isFeatured: isFeatured || false,
        status: status || 'ACTIVE',
        sortOrder: sortOrder || 0,
        screenshots: screenshots
          ? {
              create: screenshots.map((s: any, index: number) => ({
                url: s.url,
                caption: s.caption || null,
                sortOrder: s.sortOrder !== undefined ? s.sortOrder : index,
              })),
            }
          : undefined,
      },
      include: {
        screenshots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(201).json(app);
  } catch (err) {
    console.error('Failed to create partner app:', err);
    res.status(500).json({ error: 'Failed to create partner app' });
  }
}

// PUT /api/admin/partner-apps/:id - Update partner app (admin only)
export async function updatePartnerApp(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      tagline,
      description,
      iconUrl,
      installUrl,
      openUrl,
      platforms,
      price,
      features,
      promoVideoUrl,
      integrationNotes,
      isUmdbIntegrated,
      isFeatured,
      status,
      sortOrder,
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (tagline !== undefined) data.tagline = tagline;
    if (description !== undefined) data.description = description;
    if (iconUrl !== undefined) data.iconUrl = iconUrl;
    if (installUrl !== undefined) data.installUrl = installUrl;
    if (openUrl !== undefined) data.openUrl = openUrl;
    if (platforms !== undefined) data.platforms = platforms;
    if (price !== undefined) data.price = price;
    if (features !== undefined) data.features = features;
    if (promoVideoUrl !== undefined) data.promoVideoUrl = promoVideoUrl;
    if (integrationNotes !== undefined) data.integrationNotes = integrationNotes;
    if (isUmdbIntegrated !== undefined) data.isUmdbIntegrated = isUmdbIntegrated;
    if (isFeatured !== undefined) data.isFeatured = isFeatured;
    if (status !== undefined) data.status = status;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const app = await prisma.partnerApp.update({
      where: { id },
      data,
      include: {
        screenshots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json(app);
  } catch (err) {
    console.error('Failed to update partner app:', err);
    res.status(500).json({ error: 'Failed to update partner app' });
  }
}

// DELETE /api/admin/partner-apps/:id - Delete partner app (admin only)
export async function deletePartnerApp(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.partnerApp.delete({
      where: { id },
    });

    res.json({ message: 'Partner app deleted successfully' });
  } catch (err) {
    console.error('Failed to delete partner app:', err);
    res.status(500).json({ error: 'Failed to delete partner app' });
  }
}

// POST /api/admin/partner-apps/:id/screenshots - Add screenshot (admin only)
export async function addScreenshot(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { url, caption, sortOrder } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const screenshot = await prisma.partnerAppScreenshot.create({
      data: {
        appId: id,
        url,
        caption: caption || null,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(screenshot);
  } catch (err) {
    console.error('Failed to add screenshot:', err);
    res.status(500).json({ error: 'Failed to add screenshot' });
  }
}

// DELETE /api/admin/partner-apps/:id/screenshots/:screenshotId - Delete screenshot (admin only)
export async function deleteScreenshot(req: Request, res: Response): Promise<void> {
  try {
    const { screenshotId } = req.params;

    await prisma.partnerAppScreenshot.delete({
      where: { id: screenshotId },
    });

    res.json({ message: 'Screenshot deleted successfully' });
  } catch (err) {
    console.error('Failed to delete screenshot:', err);
    res.status(500).json({ error: 'Failed to delete screenshot' });
  }
}
