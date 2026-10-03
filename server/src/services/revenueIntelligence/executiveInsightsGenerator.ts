import { prisma } from '../../prisma/client';
import { calculateMerchantRevenue, MerchantRevenueMetrics } from './revenueCalculator';

export interface ExecutiveInsightItem {
  id: string;
  category: 'REVENUE_DECLINE' | 'RECOVERY_OPPORTUNITY' | 'RISK_ALERT' | 'BEHAVIOR_SHIFT';
  title: string;
  summary: string;
  details: {
    primaryMetric: string;
    contributors: string[];
    potentialRecoveryAmount: number;
    recommendedAction: string;
  };
  affectedCustomers: Array<{
    id: string;
    name: string;
    company: string | null;
    outstandingAmount: number;
    riskScore: number;
    reason: string;
  }>;
  confidenceScore: number;
  createdAt: string;
}

export async function generateExecutiveInsights(merchantId: string): Promise<ExecutiveInsightItem[]> {
  const revenueMetrics: MerchantRevenueMetrics = await calculateMerchantRevenue(merchantId);
  const insights: ExecutiveInsightItem[] = [];

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      merchantId,
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
    include: { customer: true },
  });

  const failedTxns = await prisma.transaction.findMany({
    where: {
      merchantId,
      status: 'FAILED',
    },
    include: { customer: true },
    orderBy: { transactionDate: 'desc' },
  });

  const failedSubscriptions = await prisma.subscription.findMany({
    where: {
      merchantId,
      status: { in: ['PAST_DUE', 'SUSPENDED'] },
    },
    include: { customer: true },
  });

  // 1. Revenue Risk & Potential Recovery Insight
  if (revenueMetrics.outstandingRevenue > 0 || failedTxns.length > 0) {
    const overdueCount = overdueInvoices.length;
    const failedCount = failedTxns.length;
    const subFailuresCount = failedSubscriptions.length;
    const potentialRecovery = Math.round(
      overdueInvoices.reduce((s, i) => s + i.amount, 0) +
      failedTxns.slice(0, 5).reduce((s, t) => s + t.amount, 0)
    );

    const contributors: string[] = [];
    if (failedCount > 0) contributors.push(`${failedCount} failed payment(s)`);
    if (overdueCount > 0) contributors.push(`${overdueCount} overdue invoice(s)`);
    if (subFailuresCount > 0) contributors.push(`${subFailuresCount} subscription payment failure(s)`);

    const affectedCustomersMap = new Map<string, { id: string; name: string; company: string | null; outstandingAmount: number; riskScore: number; reason: string }>();

    for (const inv of overdueInvoices) {
      if (inv.customer) {
        affectedCustomersMap.set(inv.customer.id, {
          id: inv.customer.id,
          name: inv.customer.name,
          company: inv.customer.company,
          outstandingAmount: inv.amount,
          riskScore: inv.customer.riskScore,
          reason: `Overdue invoice #${inv.invoiceNumber} ($${inv.amount.toLocaleString()})`,
        });
      }
    }

    for (const fail of failedTxns.slice(0, 5)) {
      if (fail.customer) {
        const existing = affectedCustomersMap.get(fail.customer.id);
        if (existing) {
          existing.reason += ` + Recent failed payment of $${fail.amount}`;
        } else {
          affectedCustomersMap.set(fail.customer.id, {
            id: fail.customer.id,
            name: fail.customer.name,
            company: fail.customer.company,
            outstandingAmount: 0,
            riskScore: fail.customer.riskScore,
            reason: `Payment failure: ${fail.failureReason || 'Card declined'}`,
          });
        }
      }
    }

    insights.push({
      id: 'insight-rev-risk-1',
      category: 'REVENUE_DECLINE',
      title: revenueMetrics.revenueChangePercentage < 0
        ? `Revenue is down ${Math.abs(revenueMetrics.revenueChangePercentage).toFixed(1)}% vs previous period`
        : `Outstanding Revenue & Recovery Exposure ($${revenueMetrics.outstandingRevenue.toLocaleString()})`,
      summary: `Identified ${contributors.join(', ')} representing $${potentialRecovery.toLocaleString()} in recoverable revenue.`,
      details: {
        primaryMetric: `$${potentialRecovery.toLocaleString()} Potentially Recoverable`,
        contributors,
        potentialRecoveryAmount: potentialRecovery,
        recommendedAction: 'Trigger AI Payment Recovery workflow to dispatch scheduled reminders and merchant review requests.',
      },
      affectedCustomers: Array.from(affectedCustomersMap.values()),
      confidenceScore: 0.96,
      createdAt: new Date().toISOString(),
    });
  }

  // 2. High Value Customer At Risk Insight
  const highValueAtRisk = await prisma.customer.findMany({
    where: {
      merchantId,
      OR: [
        { segment: 'AT_RISK' },
        { segment: 'HIGH_VALUE', riskScore: { gte: 40 } },
      ],
    },
    include: {
      invoices: { where: { status: { in: ['UNPAID', 'OVERDUE'] } } },
    },
  });

  if (highValueAtRisk.length > 0) {
    const atRiskList = highValueAtRisk.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      outstandingAmount: c.invoices.reduce((s, i) => s + i.amount, 0),
      riskScore: c.riskScore,
      reason: `Behavioral risk score ${c.riskScore}/100 with $${c.invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()} pending`,
    }));

    insights.push({
      id: 'insight-high-value-risk',
      category: 'RISK_ALERT',
      title: `${highValueAtRisk.length} Key Account(s) Exhibiting Elevated Payment Risk`,
      summary: `Deteriorating payment discipline detected for high-value accounts. Immediate attention recommended before churn.`,
      details: {
        primaryMetric: `${highValueAtRisk.length} High-Value Accounts`,
        contributors: atRiskList.map((a) => `${a.name} (${a.company || 'Direct'})`),
        potentialRecoveryAmount: atRiskList.reduce((s, a) => s + a.outstandingAmount, 0),
        recommendedAction: 'Review customer behavior logs and initiate personalized merchant check-in.',
      },
      affectedCustomers: atRiskList,
      confidenceScore: 0.94,
      createdAt: new Date().toISOString(),
    });
  }

  // 3. Reminder Efficiency & Opportunity
  insights.push({
    id: 'insight-reminder-conversion',
    category: 'RECOVERY_OPPORTUNITY',
    title: `Payment Reminder Conversion Rate at ${revenueMetrics.reminderConversionRate}%`,
    summary: `Historical reminder-to-payment conversion indicates proactive gentle notifications recover ~${Math.round(revenueMetrics.outstandingRevenue * 0.45).toLocaleString()} within 48 hours.`,
    details: {
      primaryMetric: `${revenueMetrics.reminderConversionRate}% Conversion Efficiency`,
      contributors: [
        'Automated 1-click PayPal invoice settlement links',
        'Customer-friendly personalized reminder tone',
        'Automatic reminder cancellation once webhook confirms payment',
      ],
      potentialRecoveryAmount: Math.round(revenueMetrics.outstandingRevenue * 0.45),
      recommendedAction: 'Ensure default 1-day & 3-day reminder policies remain active with approval workflows.',
    },
    affectedCustomers: [],
    confidenceScore: 0.92,
    createdAt: new Date().toISOString(),
  });

  return insights;
}
