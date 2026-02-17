import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default 32x32 dark (#111827) PNG as base64 — used when no icon is configured in DB
const DEFAULT_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR4nGMQlFCnKWIYtWDUglELRi0Y' +
  'tWDUglELRi0YtWDUglELhooFACXMQBCzg0aKAAAAAElFTkSuQmCC';

/** Maps URL filename → SiteSetting key */
const FILENAME_TO_KEY: Record<string, string> = {
  'favicon.png':         'icon_favicon',
  'favicon.ico':         'icon_favicon',
  'icon-192.png':        'icon_192',
  'icon-512.png':        'icon_512',
  'apple-touch-icon.png':'icon_apple',
};

// ─── Public: serve icon ───────────────────────────────────────────────────────

export const serveIcon = async (req: Request, res: Response) => {
  const { filename } = req.params;
  const key = FILENAME_TO_KEY[filename];
  if (!key) return res.status(404).json({ error: 'Unknown icon' });

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key } });
    const raw = setting?.value ?? `data:image/png;base64,${DEFAULT_ICON_B64}`;

    const match = raw.match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) return res.status(500).json({ error: 'Invalid icon data' });

    const [, mime, b64] = match;
    const buf = Buffer.from(b64.trim(), 'base64');

    const contentType = filename.endsWith('.ico') ? 'image/x-icon' : mime;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    // Allow cross-origin image loads (helmet defaults to same-origin, which blocks
    // the frontend from loading icons when it's on a different Railway service URL)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: 'Failed to serve icon' });
  }
};

// ─── Admin: get current icon settings ────────────────────────────────────────

export const getIconSettings = async (_req: Request, res: Response) => {
  const keys = ['icon_favicon', 'icon_192', 'icon_512', 'icon_apple'];
  try {
    const settings = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
    const result: Record<string, string | null> = {};
    for (const k of keys) {
      result[k] = settings.find(s => s.key === k)?.value ?? null;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
};

// ─── Admin: save icon settings ────────────────────────────────────────────────

export const updateIconSettings = async (req: Request, res: Response) => {
  const { icon_favicon, icon_192, icon_512, icon_apple } = req.body as Record<string, string | undefined>;

  const updates: { key: string; value: string }[] = [];
  if (icon_favicon) updates.push({ key: 'icon_favicon', value: icon_favicon });
  if (icon_192)     updates.push({ key: 'icon_192',     value: icon_192 });
  if (icon_512)     updates.push({ key: 'icon_512',     value: icon_512 });
  if (icon_apple)   updates.push({ key: 'icon_apple',   value: icon_apple });

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No icon data provided' });
  }

  try {
    await Promise.all(
      updates.map(u =>
        prisma.siteSetting.upsert({
          where:  { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    );
    res.json({ success: true, updated: updates.map(u => u.key) });
  } catch (err) {
    console.error('[updateIconSettings]', err);
    res.status(500).json({ error: 'Failed to save icons' });
  }
};
