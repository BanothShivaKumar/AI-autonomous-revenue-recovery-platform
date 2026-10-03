import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { config } from '../config';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, password, businessName } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const merchant = await prisma.merchant.create({
      data: {
        name: businessName || `${name}'s Business`,
        currency: 'USD',
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'MERCHANT_ADMIN',
        merchantId: merchant.id,
      },
    });

    await prisma.reminderPolicy.create({
      data: {
        merchantId: merchant.id,
        name: 'Standard Recovery Policy',
        isDefault: true,
      },
    });

    const token = jwt.sign({ userId: user.id, merchantId: merchant.id }, config.jwtSecret, {
      expiresIn: '7d' as any,
    });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      merchant: { id: merchant.id, name: merchant.name, currency: merchant.currency },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { merchant: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, merchantId: user.merchantId }, config.jwtSecret, {
      expiresIn: '7d' as any,
    });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      merchant: user.merchant,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        merchant: {
          include: {
            paypalAccounts: true,
            reminderPolicies: { where: { isDefault: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      merchant: user.merchant,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
