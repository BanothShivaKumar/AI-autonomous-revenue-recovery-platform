import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { entityType, limit } = req.query;

    const where: any = { merchantId };
    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit ? parseInt(limit as string, 10) : 100,
      orderBy: { timestamp: 'desc' },
    });

    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
