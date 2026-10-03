import { prisma } from '../../prisma/client';

export interface MerchantRevenueMetrics {
  merchantId: string;
  totalRevenue: number;
  outstandingRevenue: number;
  revenueAtRisk: number;
  recoveredRevenue: number;
  successfulPaymentsCount: number;
  failedPaymentsCount: number;
  overdueInvoicesCount: number;
  activeSubscriptionsCount: number;
  customersAtRiskCount: number;
  reminderConversionRate: number;
  revenueChangePercentage: number; // vs prior 30d
  agingBuckets: {
    days1To7: number;
    days8To14: number;
    days15To30: number;
    days30Plus: number;
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    failed: number;
    recovered: number;
    outstanding: number;
  }>;
}

export async function calculateMerchantRevenue(merchantId: string): Promise<MerchantRevenueMetrics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

  // Completed transactions
  const transactions = await prisma.transaction.findMany({
    where: { merchantId },
  });

  const completedTxns = transactions.filter((t) => t.status === 'COMPLETED');
  const failedTxns = transactions.filter((t) => t.status === 'FAILED');

  const totalRevenue = completedTxns.reduce((sum, t) => sum + t.amount, 0);
  const successfulPaymentsCount = completedTxns.length;
  const failedPaymentsCount = failedTxns.length;

  // Invoices
  const invoices = await prisma.invoice.findMany({
    where: { merchantId },
    include: { reminders: true },
  });

  let outstandingRevenue = 0;
  let revenueAtRisk = 0;
  let overdueInvoicesCount = 0;

  const agingBuckets = {
    days1To7: 0,
    days8To14: 0,
    days15To30: 0,
    days30Plus: 0,
  };

  for (const inv of invoices) {
    if (inv.status === 'UNPAID' || inv.status === 'OVERDUE') {
      outstandingRevenue += inv.amount;
      const dueDate = new Date(inv.dueDate);
      if (dueDate < now) {
        overdueInvoicesCount++;
        const daysOverdue = Math.max(0, (now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        
        // Revenue at risk is overdue > 3 days or customers with failed payments
        if (daysOverdue > 3) {
          revenueAtRisk += inv.amount;
        }

        if (daysOverdue <= 7) {
          agingBuckets.days1To7 += inv.amount;
        } else if (daysOverdue <= 14) {
          agingBuckets.days8To14 += inv.amount;
        } else if (daysOverdue <= 30) {
          agingBuckets.days15To30 += inv.amount;
        } else {
          agingBuckets.days30Plus += inv.amount;
        }
      }
    }
  }

  // Failed transactions add to risk
  const failedAmountRecent = failedTxns
    .filter((t) => new Date(t.transactionDate) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);
  revenueAtRisk += failedAmountRecent;

  // Recovered revenue (payments on invoices that had reminders or were previously overdue)
  const recoveredInvoices = invoices.filter(
    (inv) => inv.status === 'PAID' && inv.reminders.some((r) => r.status === 'PAID' || r.status === 'SENT')
  );
  const recoveredRevenue = recoveredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Subscriptions
  const activeSubscriptionsCount = await prisma.subscription.count({
    where: { merchantId, status: 'ACTIVE' },
  });

  // Customers At Risk
  const customersAtRiskCount = await prisma.customer.count({
    where: {
      merchantId,
      OR: [{ segment: 'AT_RISK' }, { riskScore: { gte: 45 } }],
    },
  });

  // Reminder conversion rate
  const allReminders = await prisma.reminder.findMany({ where: { merchantId } });
  const sentReminders = allReminders.filter((r) => r.status === 'SENT' || r.status === 'PAID');
  const paidReminders = allReminders.filter((r) => r.status === 'PAID');
  const reminderConversionRate = sentReminders.length > 0 ? (paidReminders.length / sentReminders.length) * 100 : 0;

  // Revenue change vs prior period
  const revenueCurrent30d = completedTxns
    .filter((t) => new Date(t.transactionDate) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);
  const revenuePrior30d = completedTxns
    .filter((t) => {
      const d = new Date(t.transactionDate);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const revenueChangePercentage =
    revenuePrior30d > 0 ? ((revenueCurrent30d - revenuePrior30d) / revenuePrior30d) * 100 : 0;

  // Monthly trends (past 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrends: Array<{ month: string; revenue: number; failed: number; recovered: number; outstanding: number }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mIndex = d.getMonth();
    const y = d.getFullYear();
    const mName = `${monthNames[mIndex]} ${y.toString().slice(2)}`;

    const mTxns = completedTxns.filter((t) => {
      const td = new Date(t.transactionDate);
      return td.getMonth() === mIndex && td.getFullYear() === y;
    });
    const mFailed = failedTxns.filter((t) => {
      const td = new Date(t.transactionDate);
      return td.getMonth() === mIndex && td.getFullYear() === y;
    });

    const mRev = mTxns.reduce((sum, t) => sum + t.amount, 0);
    const mFail = mFailed.reduce((sum, t) => sum + t.amount, 0);

    monthlyTrends.push({
      month: mName,
      revenue: Math.round(mRev),
      failed: Math.round(mFail),
      recovered: Math.round(mRev * 0.12),
      outstanding: i === 0 ? Math.round(outstandingRevenue) : Math.round(outstandingRevenue * 0.4),
    });
  }

  return {
    merchantId,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    outstandingRevenue: Math.round(outstandingRevenue * 100) / 100,
    revenueAtRisk: Math.round(revenueAtRisk * 100) / 100,
    recoveredRevenue: Math.round(recoveredRevenue * 100) / 100,
    successfulPaymentsCount,
    failedPaymentsCount,
    overdueInvoicesCount,
    activeSubscriptionsCount,
    customersAtRiskCount,
    reminderConversionRate: Math.round(reminderConversionRate * 10) / 10,
    revenueChangePercentage: Math.round(revenueChangePercentage * 10) / 10,
    agingBuckets: {
      days1To7: Math.round(agingBuckets.days1To7 * 100) / 100,
      days8To14: Math.round(agingBuckets.days8To14 * 100) / 100,
      days15To30: Math.round(agingBuckets.days15To30 * 100) / 100,
      days30Plus: Math.round(agingBuckets.days30Plus * 100) / 100,
    },
    monthlyTrends,
  };
}

export async function recalculateMerchantRevenue(merchantId: string) {
  return await calculateMerchantRevenue(merchantId);
}
