import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    merchantId: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      // For effortless hackathon demoing, automatically attach demo merchant if no token provided
      const defaultMerchant = await prisma.merchant.findFirst({
        include: { users: true },
      });
      if (defaultMerchant && defaultMerchant.users.length > 0) {
        const u = defaultMerchant.users[0];
        req.user = {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          merchantId: defaultMerchant.id,
        };
        return next();
      }

      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { merchant: true },
    });

    if (!user || !user.merchantId) {
      res.status(401).json({ error: 'Invalid user session or merchant not linked' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      merchantId: user.merchantId,
    };

    next();
  } catch (err) {
    // Fallback to default merchant in dev/demo mode
    const defaultMerchant = await prisma.merchant.findFirst({
      include: { users: true },
    });
    if (defaultMerchant && defaultMerchant.users.length > 0) {
      const u = defaultMerchant.users[0];
      req.user = {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        merchantId: defaultMerchant.id,
      };
      return next();
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
