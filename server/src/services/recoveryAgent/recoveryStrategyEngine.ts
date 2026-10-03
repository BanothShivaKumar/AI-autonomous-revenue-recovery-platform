import { prisma } from '../../prisma/client';
import { calculateCustomerMetrics } from '../customerIntelligence/metricsCalculator';
import { prepareAndScheduleReminder } from '../reminderAgent/reminderEngine';
import { logAudit } from '../audit/auditService';

export interface RecoveryPlanItem {
  customerId: string;
  customerName: string;
  company: string | null;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  daysOverdue: number;
  segment: string;
  riskScore: number;
  recommendedStrategy: 'FRIENDLY_REMINDER' | 'PAYMENT_RECOVERY_REQUEST' | 'MERCHANT_REVIEW' | 'ESCALATION' | 'CANCEL_REMINDERS';
  reasoning: string;
  actionId?: string;
  stagedStatus: string;
}

export async function generateRecoveryPlan(
  merchantId: string,
  filterMinDaysOverdue: number = 0
): Promise<RecoveryPlanItem[]> {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      merchantId,
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
    include: {
      reminders: true,
      customer: {
        include: {
          transactions: { orderBy: { transactionDate: 'desc' }, take: 10 },
          reminders: true,
        },
      },
    },
  });

  const now = Date.now();
  const plan: RecoveryPlanItem[] = [];

  for (const inv of overdueInvoices) {
    const dueDate = new Date(inv.dueDate).getTime();
    const daysOverdue = Math.max(0, Math.floor((now - dueDate) / 86400000));

    if (daysOverdue < filterMinDaysOverdue) {
      continue;
    }

    const customer = inv.customer;
    const metrics = await calculateCustomerMetrics(customer.id);
    const invoiceRemindersCount = inv.reminders?.length || 0;

    let strategy: 'FRIENDLY_REMINDER' | 'PAYMENT_RECOVERY_REQUEST' | 'MERCHANT_REVIEW' | 'ESCALATION' | 'CANCEL_REMINDERS' = 'FRIENDLY_REMINDER';
    let reasoning = '';

    // Rule 1: Payment already settled in PayPal
    if (inv.status === 'PAID') {
      strategy = 'CANCEL_REMINDERS';
      reasoning = 'Payment confirmed via PayPal webhook. Cancel all pending scheduled reminders.';
    }
    // Rule 2: High-value account with severe delinquency or multiple failed payments
    else if ((inv.amount >= 3000 || metrics.lifetimeRevenue >= 5000) && (daysOverdue >= 14 || metrics.recentFailureCount >= 2)) {
      strategy = 'MERCHANT_REVIEW';
      reasoning = `High-value customer ($${metrics.lifetimeRevenue.toLocaleString()} lifetime, $${inv.amount.toLocaleString()} overdue) with ${daysOverdue} days overdue and ${metrics.recentFailureCount} recent payment failures. Automated reminders may jeopardize relationship; requires personalized merchant review.`;
    }
    // Rule 3: Chronic non-responsive with max reminders
    else if (invoiceRemindersCount >= 3 || daysOverdue >= 25) {
      strategy = 'ESCALATION';
      reasoning = `Account has received ${invoiceRemindersCount} prior reminders and is ${daysOverdue} days overdue. Direct billing escalation or payment method verification needed.`;
    }
    // Rule 4: Reminder-responsive customer
    else if (metrics.reminderConversionRate >= 50 || invoiceRemindersCount === 1) {
      strategy = 'PAYMENT_RECOVERY_REQUEST';
      reasoning = `Customer has historical reminder conversion rate of ${metrics.reminderConversionRate.toFixed(0)}%. Invoice is ${daysOverdue} days overdue. Dispatch follow-up recovery link.`;
    }
    // Rule 5: Standard friendly reminder (Customer A pattern)
    else {
      strategy = 'FRIENDLY_REMINDER';
      reasoning = `Customer usually pays within ${metrics.averagePaymentDelayDays.toFixed(1)} days. Invoice is ${daysOverdue} days overdue. Friendly gentle reminder recommended.`;
    }

    plan.push({
      customerId: customer.id,
      customerName: customer.name,
      company: customer.company,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      daysOverdue,
      segment: customer.segment,
      riskScore: metrics.riskScore,
      recommendedStrategy: strategy,
      reasoning,
      stagedStatus: 'READY_TO_EXECUTE',
    });
  }

  return plan;
}

export async function executeBatchRecoveryActions(
  merchantId: string,
  minDaysOverdue: number = 3
): Promise<{ createdActionsCount: number; plan: RecoveryPlanItem[] }> {
  const plan = await generateRecoveryPlan(merchantId, minDaysOverdue);
  let createdCount = 0;

  for (const item of plan) {
    if (item.recommendedStrategy === 'FRIENDLY_REMINDER' || item.recommendedStrategy === 'PAYMENT_RECOVERY_REQUEST') {
      const result = await prepareAndScheduleReminder({
        merchantId,
        invoiceId: item.invoiceId,
        triggerSource: 'AI_RECOVERY_AGENT',
      });
      item.actionId = result.actionRequestId || result.reminderId;
      item.stagedStatus = result.status;
      createdCount++;
    } else if (item.recommendedStrategy === 'MERCHANT_REVIEW') {
      // Stage Merchant Review Action Request
      const actionRequest = await prisma.actionRequest.create({
        data: {
          merchantId,
          customerId: item.customerId,
          invoiceId: item.invoiceId,
          actionType: 'MERCHANT_REVIEW',
          permissionTier: 'FINANCIAL',
          status: 'PENDING_APPROVAL',
          proposedPayloadJson: JSON.stringify({
            invoiceNumber: item.invoiceNumber,
            amount: item.amount,
            daysOverdue: item.daysOverdue,
            strategy: 'MERCHANT_REVIEW',
          }),
          reasoning: item.reasoning,
          riskAnalysis: 'High value account at risk of churn. Direct executive outreach advised.',
          requestedBy: 'AI_RECOVERY_AGENT',
        },
      });
      item.actionId = actionRequest.id;
      item.stagedStatus = 'PENDING_APPROVAL';
      createdCount++;
    }
  }

  await logAudit({
    merchantId,
    entityType: 'ACTION_REQUEST',
    entityId: `batch-recovery-${Date.now()}`,
    action: 'BATCH_RECOVERY_PREPARED',
    performedBy: 'AI_AGENT',
    details: { count: createdCount, minDaysOverdue },
  });

  return { createdActionsCount: createdCount, plan };
}
