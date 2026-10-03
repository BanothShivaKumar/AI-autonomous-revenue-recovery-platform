import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';
import { calculateCustomerMetrics } from '../services/customerIntelligence/metricsCalculator';
import { analyzeCustomerBehaviorChange } from '../services/customerIntelligence/behaviorChangeDetector';

const router = Router();

// List all customers with precalculated metrics for AG Grid
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const customers = await prisma.customer.findMany({
      where: { merchantId },
      include: {
        transactions: true,
        invoices: true,
        reminders: true,
      },
    });

    const enriched = await Promise.all(
      customers.map(async (c) => {
        return await calculateCustomerMetrics(c.id);
      })
    );

    res.json({ customers: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Details & 360 Profile
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const merchantId = req.user!.merchantId;

    const customer = await prisma.customer.findFirst({
      where: { id, merchantId },
      include: {
        transactions: { orderBy: { transactionDate: 'desc' } },
        invoices: {
          orderBy: { issueDate: 'desc' },
          include: { reminders: { include: { events: true } } },
        },
        subscriptions: true,
        reminders: {
          orderBy: { createdAt: 'desc' },
          include: { invoice: true, events: true },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const metrics = await calculateCustomerMetrics(customer.id);

    // Monthly payment breakdown for chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: Array<{ month: string; amount: number; count: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mName = `${monthNames[mIdx]} ${yr.toString().slice(2)}`;

      const mTxns = customer.transactions.filter((t) => {
        const td = new Date(t.transactionDate);
        return td.getMonth() === mIdx && td.getFullYear() === yr && t.status === 'COMPLETED';
      });

      monthlyData.push({
        month: mName,
        amount: mTxns.reduce((s, t) => s + t.amount, 0),
        count: mTxns.length,
      });
    }

    res.json({
      customer,
      metrics,
      monthlyData,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// "What Changed?" Customer Behavior Analysis Endpoint
router.get('/:id/what-changed', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const analysis = await analyzeCustomerBehaviorChange(id);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
