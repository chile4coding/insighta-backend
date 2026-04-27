
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { Session, User } from '@prisma/client';
import prisma from './db';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-256-bit-secret-change-this-in-production';
const ACCESS_TOKEN_EXPIRES = parseInt(process.env.ACCESS_TOKEN_EXPIRES || '180'); // 3 minutes
const REFRESH_TOKEN_EXPIRES = parseInt(process.env.REFRESH_TOKEN_EXPIRES || '300'); // 5 minutes

export interface TokenPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
}

export class TokenService {
  static signAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      JWT_SECRET as Secret,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
  }

  static signRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      JWT_SECRET as Secret,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    );
  }

  static verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET as Secret) as JwtPayload & TokenPayload;
      if (decoded.type !== type) return null;
      return {
        userId: decoded.userId,
        role: decoded.role,
        type: decoded.type,
      };
    } catch {
      return null;
    }
  }

  static async createTokenPair(user: Pick<User, 'id' | 'role'>): Promise<TokenPair> {
    const payload = { userId: user.id, role: user.role };
    const accessToken = this.signAccessToken(payload);
    const refreshToken = this.signRefreshToken(payload);
    
    const accessTokenExpires = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRES;
    const refreshTokenExpires = Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRES;

    // Store refresh token in database
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(refreshTokenExpires * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpires,
      refreshTokenExpires,
    };
  }

  static async rotateRefreshToken(oldRefreshToken: string, userId: string): Promise<TokenPair | null> {
    // Delete old refresh token
    await prisma.session.deleteMany({
      where: { refreshToken: oldRefreshToken },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return this.createTokenPair(user);
  }

  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  static async validateRefreshToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { refreshToken },
    });
  }
}
