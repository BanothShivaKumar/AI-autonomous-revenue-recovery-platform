import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { prisma } from '../prisma/client';
import { sendPayPalInvoiceReminder } from '../services/paypal/paypalInvoices';
import { logAudit } from '../services/audit/auditService';

const router = Router();

// List pending and historic action requests
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { status } = req.query;

    const where: any = { merchantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const actions = await prisma.actionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        invoice: true,
      },
    });

    const pendingCount = await prisma.actionRequest.count({
      where: { merchantId, status: 'PENDING_APPROVAL' },
    });

    res.json({ actions, pendingCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve and Execute Action
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const merchantId = req.user!.merchantId;
    const { customPayload } = req.body;

    const action = await prisma.actionRequest.findFirst({
      where: { id, merchantId },
      include: { invoice: true, customer: true },
    });

    if (!action) {
      res.status(404).json({ error: 'Action request not found' });
      return;
    }

    if (action.status !== 'PENDING_APPROVAL') {
      res.status(400).json({ error: `Action request already in status ${action.status}` });
      return;
    }

    const payload = customPayload || JSON.parse(action.proposedPayloadJson);

    // Execute based on Action Type
    let executionResult: any = {};
    if (action.actionType === 'SEND_REMINDER') {
      // Find associated reminder or create
      const reminder = await prisma.reminder.findFirst({
        where: { invoiceId: action.invoiceId || '', status: 'NEEDS_REVIEW' },
      });

      if (reminder) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            messageContent: payload.messageContent || reminder.messageContent,
          },
        });
        await prisma.reminderEvent.create({
          data: {
            reminderId: reminder.id,
            eventType: 'SENT',
            metadataJson: JSON.stringify({ approvedBy: req.user!.name }),
          },
        });
      }

      if (action.invoice?.paypalInvoiceId) {
        await sendPayPalInvoiceReminder(action.invoice.paypalInvoiceId, payload.messageContent);
      }

      executionResult = { message: 'PayPal reminder dispatched successfully', sentAt: new Date() };
    } else if (action.actionType === 'MERCHANT_REVIEW') {
      executionResult = { message: 'Merchant Review logged and acknowledged', reviewedBy: req.user!.name };
    } else {
      executionResult = { message: `Authorized action ${action.actionType} completed`, executedAt: new Date() };
    }

    // Update Action status
    const updatedAction = await prisma.actionRequest.update({
      where: { id: action.id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user!.name,
        approvedAt: new Date(),
        executedAt: new Date(),
        executionResultJson: JSON.stringify(executionResult),
      },
    });

    await logAudit({
      merchantId,
      entityType: 'ACTION_REQUEST',
      entityId: action.id,
      action: 'APPROVED_AND_EXECUTED',
      performedBy: 'USER',
      userRole: req.user!.role,
      details: { actionType: action.actionType, executionResult },
    });

    res.json({
      message: 'Action approved and executed successfully',
      action: updatedAction,
      result: executionResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Action
router.post('/:id/reject', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const merchantId = req.user!.merchantId;
    const { rejectionReason } = req.body;

    const action = await prisma.actionRequest.findFirst({
      where: { id, merchantId },
    });

    if (!action) {
      res.status(404).json({ error: 'Action request not found' });
      return;
    }

    const updated = await prisma.actionRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: req.user!.name,
        approvedAt: new Date(),
        executionResultJson: JSON.stringify({ reason: rejectionReason || 'Rejected by merchant admin' }),
      },
    });

    // If there was a linked reminder in NEEDS_REVIEW, cancel it
    if (action.invoiceId) {
      await prisma.reminder.updateMany({
        where: { invoiceId: action.invoiceId, status: 'NEEDS_REVIEW' },
        data: { status: 'CANCELLED' },
      });
    }

    await logAudit({
      merchantId,
      entityType: 'ACTION_REQUEST',
      entityId: action.id,
      action: 'REJECTED',
      performedBy: 'USER',
      userRole: req.user!.role,
      details: { rejectionReason },
    });

    res.json({ message: 'Action rejected', action: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
