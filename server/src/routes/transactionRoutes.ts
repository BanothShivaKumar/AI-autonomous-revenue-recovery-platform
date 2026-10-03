import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { status, limit } = req.query;

    const where: any = { merchantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit ? parseInt(limit as string, 10) : 100,
      orderBy: { transactionDate: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true, segment: true } },
        invoice: true,
      },
    });

    res.json({ transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
