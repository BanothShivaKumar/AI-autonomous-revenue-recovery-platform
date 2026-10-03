import { prisma } from '../../prisma/client';
import { calculateCustomerMetrics, CustomerCalculatedMetrics } from './metricsCalculator';

export interface SegmentSummary {
  segment: string;
  label: string;
  count: number;
  totalRevenue: number;
  outstandingRevenue: number;
  averageRiskScore: number;
  description: string;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    revenue: number;
    riskScore: number;
    outstanding: number;
    segment: string;
  }>;
}

export const SEGMENT_DEFINITIONS: Record<string, { label: string; description: string; rule: string }> = {
  HIGH_VALUE: {
    label: 'High-Value',
    description: 'Top revenue contributors representing significant business volume.',
    rule: 'Lifetime Revenue >= $5,000 OR >10% of total merchant revenue',
  },
  AT_RISK: {
    label: 'At-Risk',
    description: 'Customers exhibiting behavioral degradation, payment failures, or high overdue intervals.',
    rule: 'Risk Score >= 45 OR Overdue > 10 days OR >= 2 recent failed payments',
  },
  OVERDUE: {
    label: 'Overdue',
    description: 'Customers with one or more unsettled invoices currently past due.',
    rule: 'Has unpaid invoice past due date with risk score < 45',
  },
  REMINDER_RESPONSIVE: {
    label: 'Reminder-Responsive',
    description: 'Customers with high conversion rates following payment reminders.',
    rule: 'Reminder-to-Payment Conversion >= 50% and >= 1 reminder history',
  },
  DECLINING: {
    label: 'Declining',
    description: 'Customers whose recent payment frequency or revenue run-rate has dropped noticeably.',
    rule: 'Recent 30D revenue drop > 50% vs historical monthly run-rate OR payment delay increased by > 2.5 days',
  },
  RELIABLE: {
    label: 'Reliable',
    description: 'Consistent, on-time payers with minimal payment friction.',
    rule: 'On-time payment rate >= 85%, failure rate <= 5%, no overdue invoices',
  },
  NEW: {
    label: 'New Customers',
    description: 'Recently acquired accounts with limited transaction history.',
    rule: 'First seen within 30 days and <= 2 transactions',
  },
  INACTIVE: {
    label: 'Inactive',
    description: 'Dormant accounts with no recent financial activity in the past 90+ days.',
    rule: 'No transactions in 90+ days',
  },
};

export async function getSegmentAnalytics(merchantId: string): Promise<Record<string, SegmentSummary>> {
  const customers = await prisma.customer.findMany({
    where: { merchantId },
    include: {
      transactions: { where: { status: 'COMPLETED' } },
      invoices: true,
    },
  });

  const segmentMap: Record<string, SegmentSummary> = {};

  // Initialize all segments
  for (const [key, def] of Object.entries(SEGMENT_DEFINITIONS)) {
    segmentMap[key] = {
      segment: key,
      label: def.label,
      description: def.description,
      count: 0,
      totalRevenue: 0,
      outstandingRevenue: 0,
      averageRiskScore: 0,
      customers: [],
    };
  }

  for (const cust of customers) {
    const revenue = cust.transactions.reduce((sum, t) => sum + t.amount, 0);
    const outstanding = cust.invoices
      .filter((i) => i.status === 'UNPAID' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.amount, 0);

    const segKey = cust.segment in segmentMap ? cust.segment : 'RELIABLE';
    const target = segmentMap[segKey];

    target.count += 1;
    target.totalRevenue += revenue;
    target.outstandingRevenue += outstanding;
    target.averageRiskScore += cust.riskScore;
    target.customers.push({
      id: cust.id,
      name: cust.name,
      email: cust.email,
      company: cust.company,
      revenue,
      riskScore: cust.riskScore,
      outstanding,
      segment: cust.segment,
    });
  }

  // Calculate averages
  for (const seg of Object.values(segmentMap)) {
    if (seg.count > 0) {
      seg.averageRiskScore = Math.round((seg.averageRiskScore / seg.count) * 10) / 10;
      seg.totalRevenue = Math.round(seg.totalRevenue * 100) / 100;
      seg.outstandingRevenue = Math.round(seg.outstandingRevenue * 100) / 100;
    }
  }

  return segmentMap;
}
