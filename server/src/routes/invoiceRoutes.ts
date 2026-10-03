import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';
import { createPayPalInvoice } from '../services/paypal/paypalInvoices';
import { prepareAndScheduleReminder } from '../services/reminderAgent/reminderEngine';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { status } = req.query;

    const where: any = { merchantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        customer: true,
        reminders: true,
      },
    });

    const now = Date.now();
    const enriched = invoices.map((inv) => {
      const isOverdue = (inv.status === 'OVERDUE' || inv.status === 'UNPAID') && new Date(inv.dueDate).getTime() < now;
      const daysOverdue = isOverdue ? Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000) : 0;
      return {
        ...inv,
        daysOverdue,
        isOverdue,
      };
    });

    res.json({ invoices: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger Reminder for invoice
router.post('/:id/remind', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { id } = req.params;
    const { messageContent } = req.body;

    const result = await prepareAndScheduleReminder({
      merchantId,
      invoiceId: id,
      customMessage: messageContent,
      triggerSource: 'MANUAL_DASHBOARD',
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
