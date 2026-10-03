import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const subscriptions = await prisma.subscription.findMany({
      where: { merchantId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ subscriptions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
