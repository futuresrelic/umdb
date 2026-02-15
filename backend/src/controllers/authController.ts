import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient, UserRole } from '@prisma/client';
import { generateToken } from '../middleware/auth';

const prisma = new PrismaClient();

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
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

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed`);
  }
}

export function getGoogleAuthUrl(req: Request, res: Response): void {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
