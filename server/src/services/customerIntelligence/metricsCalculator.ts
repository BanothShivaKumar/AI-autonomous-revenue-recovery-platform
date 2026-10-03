import { prisma } from '../../prisma/client';

export interface CustomerCalculatedMetrics {
  customerId: string;
  name: string;
  email: string;
  company: string | null;
  
  // Payment Behavior
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmountPaid: number;
  averageTransactionAmount: number;
  medianTransactionAmount: number;
  averagePaymentDelayDays: number;
  onTimePaymentPercentage: number;
  overdueFrequency: number;
  paymentFailureRate: number;

  // Revenue Contribution
  lifetimeRevenue: number;
  revenue30d: number;
  revenue90d: number;
  revenue365d: number;
  percentageOfMerchantRevenue: number;

  // Outstanding Activity
  outstandingInvoiceAmount: number;
  overdueInvoiceCount: number;
  oldestOutstandingDays: number;
  failedPaymentAmount: number;
  pendingPaymentAmount: number;

  // Reminder Behavior
  remindersSentCount: number;
  remindersPaidCount: number;
  reminderConversionRate: number;
  averageTimeToPaymentAfterReminderHours: number;
  ignoredRemindersCount: number;

  // Behavioral Trends (Historical vs Recent 30D)
  historicalAvgDelayDays: number;
  recentAvgDelayDays: number;
  delayChangeDays: number;
  historicalFailureCount: number;
  recentFailureCount: number;
  historicalRevenueMonthlyAvg: number;
  recentRevenue30d: number;

  // Deterministic Risk Score & Segment
  riskScore: number;
  riskIndicators: string[];
  suggestedSegment: string;
}

export async function calculateCustomerMetrics(customerId: string): Promise<CustomerCalculatedMetrics> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      transactions: true,
      invoices: true,
      payments: true,
      reminders: { include: { events: true } },
    },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const yearAgo = new Date(now.getTime() - 365 * 86400000);

  // 1. Transactions Analysis
  const txns = customer.transactions;
  const completedTxns = txns.filter((t) => t.status === 'COMPLETED');
  const failedTxns = txns.filter((t) => t.status === 'FAILED');
  const totalTransactions = txns.length;
  const successfulTransactions = completedTxns.length;
  const failedTransactions = failedTxns.length;
  const totalAmountPaid = completedTxns.reduce((sum, t) => sum + t.amount, 0);

  const txAmounts = completedTxns.map((t) => t.amount).sort((a, b) => a - b);
  const averageTransactionAmount = completedTxns.length > 0 ? totalAmountPaid / completedTxns.length : 0;
  let medianTransactionAmount = 0;
  if (txAmounts.length > 0) {
    const mid = Math.floor(txAmounts.length / 2);
    medianTransactionAmount = txAmounts.length % 2 !== 0 ? txAmounts[mid] : (txAmounts[mid - 1] + txAmounts[mid]) / 2;
  }

  const paymentFailureRate = totalTransactions > 0 ? (failedTransactions / totalTransactions) * 100 : 0;

  // 2. Revenue Contribution Windows
  const revenue30d = completedTxns
    .filter((t) => new Date(t.transactionDate) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const revenue90d = completedTxns
    .filter((t) => new Date(t.transactionDate) >= ninetyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  const revenue365d = completedTxns
    .filter((t) => new Date(t.transactionDate) >= yearAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  // Merchant total revenue comparison
  const merchantTotalAgg = await prisma.transaction.aggregate({
    where: { merchantId: customer.merchantId, status: 'COMPLETED' },
    _sum: { amount: true },
  });
  const merchantTotal = merchantTotalAgg._sum.amount || 1;
  const percentageOfMerchantRevenue = (totalAmountPaid / merchantTotal) * 100;

  // 3. Invoices & Delays
  const invoices = customer.invoices;
  let totalDelayDays = 0;
  let paidInvoicesCount = 0;
  let onTimeInvoicesCount = 0;
  let overdueCount = 0;
  let outstandingAmount = 0;
  let oldestOutstandingDays = 0;

  // Historical vs Recent delays
  let historicalDelaySum = 0;
  let historicalDelayCount = 0;
  let recentDelaySum = 0;
  let recentDelayCount = 0;

  for (const inv of invoices) {
    const dueDate = new Date(inv.dueDate);
    if (inv.status === 'PAID' && inv.paidDate) {
      paidInvoicesCount++;
      const paidDate = new Date(inv.paidDate);
      const delayDays = Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      totalDelayDays += delayDays;

      if (delayDays <= 0) {
        onTimeInvoicesCount++;
      }

      if (paidDate < thirtyDaysAgo) {
        historicalDelaySum += delayDays;
        historicalDelayCount++;
      } else {
        recentDelaySum += delayDays;
        recentDelayCount++;
      }
    } else if (inv.status === 'OVERDUE' || (inv.status === 'UNPAID' && dueDate < now)) {
      overdueCount++;
      outstandingAmount += inv.amount;
      const daysOverdue = Math.max(0, (now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      if (daysOverdue > oldestOutstandingDays) {
        oldestOutstandingDays = Math.round(daysOverdue);
      }
    } else if (inv.status === 'UNPAID') {
      outstandingAmount += inv.amount;
    }
  }

  const averagePaymentDelayDays = paidInvoicesCount > 0 ? totalDelayDays / paidInvoicesCount : 0;
  const onTimePaymentPercentage = paidInvoicesCount > 0 ? (onTimeInvoicesCount / paidInvoicesCount) * 100 : 100;
  const overdueFrequency = invoices.length > 0 ? (overdueCount / invoices.length) * 100 : 0;

  const historicalAvgDelayDays = historicalDelayCount > 0 ? historicalDelaySum / historicalDelayCount : averagePaymentDelayDays;
  const recentAvgDelayDays = recentDelayCount > 0 ? recentDelaySum / recentDelayCount : historicalAvgDelayDays;
  const delayChangeDays = recentAvgDelayDays - historicalAvgDelayDays;

  // Failed counts
  const recentFailureCount = failedTxns.filter((t) => new Date(t.transactionDate) >= thirtyDaysAgo).length;
  const historicalFailureCount = failedTxns.filter((t) => new Date(t.transactionDate) < thirtyDaysAgo).length;
  const failedPaymentAmount = failedTxns.reduce((sum, t) => sum + t.amount, 0);

  // 4. Reminder Behavior
  const reminders = customer.reminders;
  const remindersSentCount = reminders.filter((r) => r.status === 'SENT' || r.status === 'PAID').length;
  const remindersPaidCount = reminders.filter((r) => r.status === 'PAID').length;
  const reminderConversionRate = remindersSentCount > 0 ? (remindersPaidCount / remindersSentCount) * 100 : 0;
  const ignoredRemindersCount = reminders.filter((r) => r.status === 'SENT' && !r.sentAt).length;

  let totalResponseHours = 0;
  let responseCount = 0;
  for (const r of reminders) {
    if (r.responseTimeMinutes) {
      totalResponseHours += r.responseTimeMinutes / 60;
      responseCount++;
    }
  }
  const averageTimeToPaymentAfterReminderHours = responseCount > 0 ? totalResponseHours / responseCount : 24;

  // 5. Deterministic Risk Score Calculation (0 - 100)
  let riskScore = 0;
  const riskIndicators: string[] = [];

  if (oldestOutstandingDays > 14) {
    riskScore += 35;
    riskIndicators.push('Invoice overdue > 14 days');
  } else if (oldestOutstandingDays > 3) {
    riskScore += 20;
    riskIndicators.push('Invoice overdue > 3 days');
  } else if (overdueCount > 0) {
    riskScore += 10;
    riskIndicators.push('Outstanding overdue balance');
  }

  if (recentFailureCount > 0) {
    riskScore += Math.min(30, recentFailureCount * 15);
    riskIndicators.push(`${recentFailureCount} recent failed payment(s) in last 30 days`);
  }

  if (delayChangeDays > 3.0) {
    riskScore += 20;
    riskIndicators.push(`Payment delay increased by ${delayChangeDays.toFixed(1)} days recently`);
  }

  const historicalRevenueMonthlyAvg = revenue90d > 0 ? revenue90d / 3 : totalAmountPaid / 12;
  if (historicalRevenueMonthlyAvg > 200 && revenue30d < historicalRevenueMonthlyAvg * 0.4) {
    riskScore += 15;
    riskIndicators.push('Significant revenue decline (>60% drop in last 30 days)');
  }

  if (paymentFailureRate > 15) {
    riskScore += 15;
    riskIndicators.push(`High historical failure rate (${paymentFailureRate.toFixed(1)}%)`);
  }

  // Cap risk score
  riskScore = Math.min(100, Math.max(0, riskScore));

  // 6. Deterministic Segment Classification
  let suggestedSegment = 'RELIABLE';
  if (riskScore >= 45 || oldestOutstandingDays >= 10 || recentFailureCount >= 2) {
    suggestedSegment = 'AT_RISK';
  } else if (overdueCount > 0) {
    suggestedSegment = 'OVERDUE';
  } else if (totalAmountPaid >= 5000 || percentageOfMerchantRevenue >= 10) {
    suggestedSegment = 'HIGH_VALUE';
  } else if (reminderConversionRate >= 50 && remindersSentCount >= 1) {
    suggestedSegment = 'REMINDER_RESPONSIVE';
  } else if (delayChangeDays > 2.5 || (historicalRevenueMonthlyAvg > 200 && revenue30d < historicalRevenueMonthlyAvg * 0.5)) {
    suggestedSegment = 'DECLINING';
  } else if (totalTransactions <= 2 && new Date(customer.firstSeenAt) >= thirtyDaysAgo) {
    suggestedSegment = 'NEW';
  } else if (completedTxns.length > 0 && new Date(customer.lastSeenAt) < ninetyDaysAgo) {
    suggestedSegment = 'INACTIVE';
  }

  // Update customer record with deterministic metrics
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      segment: suggestedSegment,
      riskScore: Math.round(riskScore * 10) / 10,
    },
  });

  return {
    customerId: customer.id,
    name: customer.name,
    email: customer.email,
    company: customer.company,
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    totalAmountPaid,
    averageTransactionAmount: Math.round(averageTransactionAmount * 100) / 100,
    medianTransactionAmount: Math.round(medianTransactionAmount * 100) / 100,
    averagePaymentDelayDays: Math.round(averagePaymentDelayDays * 10) / 10,
    onTimePaymentPercentage: Math.round(onTimePaymentPercentage * 10) / 10,
    overdueFrequency: Math.round(overdueFrequency * 10) / 10,
    paymentFailureRate: Math.round(paymentFailureRate * 10) / 10,
    lifetimeRevenue: totalAmountPaid,
    revenue30d,
    revenue90d,
    revenue365d,
    percentageOfMerchantRevenue: Math.round(percentageOfMerchantRevenue * 10) / 10,
    outstandingInvoiceAmount: outstandingAmount,
    overdueInvoiceCount: overdueCount,
    oldestOutstandingDays,
    failedPaymentAmount,
    pendingPaymentAmount: 0,
    remindersSentCount,
    remindersPaidCount,
    reminderConversionRate: Math.round(reminderConversionRate * 10) / 10,
    averageTimeToPaymentAfterReminderHours: Math.round(averageTimeToPaymentAfterReminderHours * 10) / 10,
    ignoredRemindersCount,
    historicalAvgDelayDays: Math.round(historicalAvgDelayDays * 10) / 10,
    recentAvgDelayDays: Math.round(recentAvgDelayDays * 10) / 10,
    delayChangeDays: Math.round(delayChangeDays * 10) / 10,
    historicalFailureCount,
    recentFailureCount,
    historicalRevenueMonthlyAvg: Math.round(historicalRevenueMonthlyAvg * 100) / 100,
    recentRevenue30d: revenue30d,
    riskScore: Math.round(riskScore * 10) / 10,
    riskIndicators,
    suggestedSegment,
  };
}
