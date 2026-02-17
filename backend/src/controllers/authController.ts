import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient, UserRole } from '@prisma/client';
import { generateToken } from '../middleware/auth';

const prisma = new PrismaClient();

function getAllowedOrigins(): string[] {
  return process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173'];
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query;
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  // Decode caller's origin from state so we redirect back to the same domain.
  // Falls back to FRONTEND_URL env var if state is missing or invalid.
  const defaultFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  let frontendUrl = defaultFrontend;

  if (state && typeof state === 'string') {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (decoded.origin && getAllowedOrigins().includes(decoded.origin)) {
        frontendUrl = decoded.origin;
      }
    } catch {
      // Invalid state — use default
    }
  }

  try {
    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenRes.data;

    // Get user info from Google
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id: googleId, email, name, picture } = userRes.data;

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { googleId },
      update: { email, name, photo: picture },
      create: {
        googleId,
        email,
        name,
        photo: picture,
        role: UserRole.USER,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.photo,
      role: user.role,
    });

    // Redirect to the same origin that initiated auth
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
  }
}

export function getGoogleAuthUrl(req: Request, res: Response): void {
  // Capture caller's origin so the callback can redirect back to the correct domain.
  // This ensures the PWA on umdb.ca lands back on umdb.ca after Google auth,
  // regardless of what FRONTEND_URL is set to.
  const origin = (req.headers.origin as string) ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173';

  const state = Buffer.from(JSON.stringify({ origin })).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
