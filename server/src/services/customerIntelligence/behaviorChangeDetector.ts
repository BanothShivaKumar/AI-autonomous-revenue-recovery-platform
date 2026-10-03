import { calculateCustomerMetrics, CustomerCalculatedMetrics } from './metricsCalculator';
import { prisma } from '../../prisma/client';

export interface BehaviorChangeAnalysis {
  customerId: string;
  customerName: string;
  company: string | null;
  overallStatus: 'STABLE' | 'IMPROVING' | 'DETERIORATING' | 'CRITICAL';
  historicalBaseline: {
    revenue90d: number;
    monthlyRunRate: number;
    averagePaymentDelayDays: number;
    failedPaymentCount: number;
    onTimePercentage: number;
  };
  recentBehavior: {
    revenue30d: number;
    averagePaymentDelayDays: number;
    failedPaymentCount: number;
    outstandingAmount: number;
    overdueDays: number;
  };
  deltaMetrics: {
    delayDifferenceDays: number;
    delayChangePercentage: number;
    newFailures: number;
    revenueVariance: number;
  };
  keyFindings: string[];
  aiAssessment: string;
  recommendedAction: string;
  actionDetails: {
    actionType: 'SEND_REMINDER' | 'PAYMENT_REQUEST' | 'MERCHANT_REVIEW' | 'ESCALATE' | 'NO_ACTION';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    targetInvoiceId?: string;
    targetAmount?: number;
    reason: string;
  };
}

export async function analyzeCustomerBehaviorChange(customerId: string): Promise<BehaviorChangeAnalysis> {
  const metrics: CustomerCalculatedMetrics = await calculateCustomerMetrics(customerId);

  const keyFindings: string[] = [];
  let deteriorationPoints = 0;

  // 1. Payment Delay Shift
  const delayDelta = metrics.delayChangeDays;
  if (delayDelta > 2.0) {
    deteriorationPoints += 2;
    keyFindings.push(
      `Average payment delay increased from ${metrics.historicalAvgDelayDays.toFixed(1)} days to ${metrics.recentAvgDelayDays.toFixed(1)} days (+${delayDelta.toFixed(1)} days slower).`
    );
  } else if (delayDelta < -1.0) {
    keyFindings.push(
      `Payment speed improved by ${Math.abs(delayDelta).toFixed(1)} days recently.`
    );
  } else {
    keyFindings.push(`Payment delay remains steady around ${metrics.averagePaymentDelayDays.toFixed(1)} days.`);
  }

  // 2. Failure rate shift
  if (metrics.recentFailureCount > 0) {
    deteriorationPoints += metrics.recentFailureCount * 2;
    keyFindings.push(
      `Experienced ${metrics.recentFailureCount} payment failure(s) in the last 30 days (compared to ${metrics.historicalFailureCount} historically).`
    );
  }

  // 3. Outstanding balance & overdue days
  if (metrics.outstandingInvoiceAmount > 0) {
    if (metrics.oldestOutstandingDays > 7) {
      deteriorationPoints += 3;
      keyFindings.push(
        `Current outstanding invoice of $${metrics.outstandingInvoiceAmount.toLocaleString()} is ${metrics.oldestOutstandingDays} days overdue.`
      );
    } else if (metrics.oldestOutstandingDays > 0) {
      deteriorationPoints += 1;
      keyFindings.push(
        `Current outstanding invoice of $${metrics.outstandingInvoiceAmount.toLocaleString()} is ${metrics.oldestOutstandingDays} days overdue.`
      );
    } else {
      keyFindings.push(
        `Current outstanding balance: $${metrics.outstandingInvoiceAmount.toLocaleString()} (within normal payment window).`
      );
    }
  } else {
    keyFindings.push('Zero outstanding balance at present.');
  }

  // 4. Revenue Trajectory
  const monthlyHistoricalRate = metrics.revenue90d > 0 ? metrics.revenue90d / 3 : metrics.lifetimeRevenue / 6;
  const revenueVariance = monthlyHistoricalRate > 0 ? ((metrics.revenue30d - monthlyHistoricalRate) / monthlyHistoricalRate) * 100 : 0;
  if (monthlyHistoricalRate > 300 && revenueVariance < -40) {
    deteriorationPoints += 2;
    keyFindings.push(
      `Recent 30-day revenue ($${metrics.revenue30d.toLocaleString()}) is down ${Math.abs(Math.round(revenueVariance))}% vs historical monthly baseline ($${Math.round(monthlyHistoricalRate).toLocaleString()}).`
    );
  }

  // Determine overall status
  let overallStatus: 'STABLE' | 'IMPROVING' | 'DETERIORATING' | 'CRITICAL' = 'STABLE';
  if (deteriorationPoints >= 5 || (metrics.recentFailureCount >= 2 && metrics.oldestOutstandingDays > 10)) {
    overallStatus = 'CRITICAL';
  } else if (deteriorationPoints >= 2) {
    overallStatus = 'DETERIORATING';
  } else if (delayDelta < -0.5 && metrics.recentFailureCount === 0) {
    overallStatus = 'IMPROVING';
  }

  // Find target invoice for recovery action
  const latestUnpaidInvoice = await prisma.invoice.findFirst({
    where: {
      customerId,
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Determine AI assessment and action
  let aiAssessment = '';
  let recommendedAction = '';
  let actionType: 'SEND_REMINDER' | 'PAYMENT_REQUEST' | 'MERCHANT_REVIEW' | 'ESCALATE' | 'NO_ACTION' = 'NO_ACTION';
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

  if (overallStatus === 'CRITICAL') {
    aiAssessment = `Severe behavioral degradation detected: High overdue interval (${metrics.oldestOutstandingDays}d) with multiple recent payment failures. Automated reminders may be ineffective or irritate the client.`;
    recommendedAction = `Escalate to Merchant Review before issuing any aggressive dunning. Review account terms and verify if payment method updated in PayPal.`;
    actionType = 'MERCHANT_REVIEW';
    priority = 'HIGH';
  } else if (overallStatus === 'DETERIORATING') {
    aiAssessment = `Payment behavior is noticeably weaker than historical baseline (+${delayDelta.toFixed(1)}d delay). Customer has historically settled invoices when reminded.`;
    recommendedAction = `Prepare and send a friendly PayPal payment reminder with one-click payment link.`;
    actionType = 'SEND_REMINDER';
    priority = 'MEDIUM';
  } else if (metrics.outstandingInvoiceAmount > 0) {
    aiAssessment = `Customer exhibits healthy historical payment discipline (${metrics.onTimePaymentPercentage.toFixed(0)}% on-time). Current overdue status is likely an oversight.`;
    recommendedAction = `Send standard gentle payment reminder.`;
    actionType = 'SEND_REMINDER';
    priority = 'LOW';
  } else {
    aiAssessment = `Account is in good standing with consistent payment history and low friction.`;
    recommendedAction = `No action required. Maintain standard relationship monitoring.`;
    actionType = 'NO_ACTION';
    priority = 'LOW';
  }

  return {
    customerId: metrics.customerId,
    customerName: metrics.name,
    company: metrics.company,
    overallStatus,
    historicalBaseline: {
      revenue90d: metrics.revenue90d,
      monthlyRunRate: Math.round(monthlyHistoricalRate * 100) / 100,
      averagePaymentDelayDays: metrics.historicalAvgDelayDays,
      failedPaymentCount: metrics.historicalFailureCount,
      onTimePercentage: metrics.onTimePaymentPercentage,
    },
    recentBehavior: {
      revenue30d: metrics.revenue30d,
      averagePaymentDelayDays: metrics.recentAvgDelayDays,
      failedPaymentCount: metrics.recentFailureCount,
      outstandingAmount: metrics.outstandingInvoiceAmount,
      overdueDays: metrics.oldestOutstandingDays,
    },
    deltaMetrics: {
      delayDifferenceDays: Math.round(delayDelta * 10) / 10,
      delayChangePercentage: metrics.historicalAvgDelayDays > 0 ? Math.round((delayDelta / metrics.historicalAvgDelayDays) * 100) : 0,
      newFailures: metrics.recentFailureCount,
      revenueVariance: Math.round(revenueVariance * 10) / 10,
    },
    keyFindings,
    aiAssessment,
    recommendedAction,
    actionDetails: {
      actionType,
      priority,
      targetInvoiceId: latestUnpaidInvoice?.id,
      targetAmount: latestUnpaidInvoice?.amount,
      reason: keyFindings.join(' '),
    },
  };
}
