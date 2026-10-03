import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';
import { getReminderPerformance } from '../services/reminderAgent/reminderOutcomeTracker';

const router = Router();

// List all reminders
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const reminders = await prisma.reminder.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        invoice: true,
        events: { orderBy: { timestamp: 'desc' } },
      },
    });

    const performance = await getReminderPerformance(merchantId);
    const policy = await prisma.reminderPolicy.findFirst({
      where: { merchantId, isDefault: true },
    });

    res.json({
      reminders,
      performance,
      policy,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Policy
router.put('/policy', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { firstReminderDays, secondReminderDays, finalReminderDays, maxReminders, minIntervalDays, stopOnPayment, requireApproval } = req.body;

    const updated = await prisma.reminderPolicy.updateMany({
      where: { merchantId, isDefault: true },
      data: {
        firstReminderDays: firstReminderDays !== undefined ? parseInt(firstReminderDays, 10) : 1,
        secondReminderDays: secondReminderDays !== undefined ? parseInt(secondReminderDays, 10) : 3,
        finalReminderDays: finalReminderDays !== undefined ? parseInt(finalReminderDays, 10) : 7,
        maxReminders: maxReminders !== undefined ? parseInt(maxReminders, 10) : 3,
        minIntervalDays: minIntervalDays !== undefined ? parseInt(minIntervalDays, 10) : 2,
        stopOnPayment: stopOnPayment !== undefined ? Boolean(stopOnPayment) : true,
        requireApproval: requireApproval !== undefined ? Boolean(requireApproval) : true,
      },
    });

    res.json({ message: 'Policy updated', policy: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
