import { calculateMerchantRevenue, MerchantRevenueMetrics } from './revenueCalculator';
import { prisma } from '../../prisma/client';

export interface SimulationScenarioResult {
  scenarioName: string;
  recoveryPercentage: number;
  currentOutstandingRevenue: number;
  currentRevenueAtRisk: number;
  projectedRecoveredAmount: number;
  projectedNetRevenueGrowth: number;
  projectedCashFlowImpact: number;
  recommendedFocusAreas: string[];
  actionPlan: Array<{
    step: number;
    action: string;
    targetSegment: string;
    potentialRecovery: number;
  }>;
}

export async function simulateRevenueScenario(
  merchantId: string,
  recoveryRatePercent: number = 30
): Promise<SimulationScenarioResult> {
  const metrics: MerchantRevenueMetrics = await calculateMerchantRevenue(merchantId);
  const rateDecimal = Math.max(0.05, Math.min(1.0, recoveryRatePercent / 100));

  const totalPotentiallyRecoverable = metrics.outstandingRevenue + (metrics.revenueAtRisk - metrics.outstandingRevenue);
  const projectedRecoveredAmount = Math.round(metrics.outstandingRevenue * rateDecimal * 100) / 100;
  const projectedNetRevenueGrowth =
    metrics.totalRevenue > 0
      ? Math.round(((projectedRecoveredAmount) / metrics.totalRevenue) * 1000) / 10
      : 0;

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      merchantId,
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
    include: { customer: true },
  });

  const bucket1To7 = overdueInvoices.filter((i) => {
    const diff = (Date.now() - new Date(i.dueDate).getTime()) / 86400000;
    return diff <= 7;
  });

  const bucket8Plus = overdueInvoices.filter((i) => {
    const diff = (Date.now() - new Date(i.dueDate).getTime()) / 86400000;
    return diff > 7;
  });

  const sum1To7 = bucket1To7.reduce((s, i) => s + i.amount, 0);
  const sum8Plus = bucket8Plus.reduce((s, i) => s + i.amount, 0);

  return {
    scenarioName: `${recoveryRatePercent}% Revenue Recovery Target`,
    recoveryPercentage: recoveryRatePercent,
    currentOutstandingRevenue: metrics.outstandingRevenue,
    currentRevenueAtRisk: metrics.revenueAtRisk,
    projectedRecoveredAmount,
    projectedNetRevenueGrowth,
    projectedCashFlowImpact: projectedRecoveredAmount,
    recommendedFocusAreas: [
      `Prioritize ${bucket1To7.length} recently overdue invoices ($${sum1To7.toLocaleString()}) with automated polite reminders.`,
      `Conduct merchant review for ${bucket8Plus.length} severely overdue accounts ($${sum8Plus.toLocaleString()}) before escalation.`,
      `Engage high-value reminder-responsive accounts where historical recovery rate is >50%.`,
    ],
    actionPlan: [
      {
        step: 1,
        action: 'Automated Friendly Reminders to 1-7 day overdue cohort',
        targetSegment: 'OVERDUE & RELIABLE',
        potentialRecovery: Math.round(sum1To7 * 0.75),
      },
      {
        step: 2,
        action: 'Direct Payment Link & Merchant Review for 8+ day overdue accounts',
        targetSegment: 'AT_RISK & HIGH_VALUE',
        potentialRecovery: Math.round(sum8Plus * 0.45),
      },
      {
        step: 3,
        action: 'Subscription Retry & Dunning cadence for failed recurring payments',
        targetSegment: 'DECLINING',
        potentialRecovery: Math.round((metrics.revenueAtRisk - metrics.outstandingRevenue) * 0.5),
      },
    ],
  };
}
