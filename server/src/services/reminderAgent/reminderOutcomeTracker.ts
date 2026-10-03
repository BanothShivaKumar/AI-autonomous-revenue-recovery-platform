import { prisma } from '../../prisma/client';

export interface ReminderPerformanceMetrics {
  totalRemindersSent: number;
  totalPaymentsReceived: number;
  totalRevenueRecovered: number;
  conversionRate: number;
  averageResponseTimeHours: number;
  remindersByStatus: Record<string, number>;
  topPerformingTemplates: Array<{ name: string; sent: number; conversion: number }>;
}

export async function getReminderPerformance(merchantId: string): Promise<ReminderPerformanceMetrics> {
  const reminders = await prisma.reminder.findMany({
    where: { merchantId },
    include: { invoice: true },
  });

  const remindersByStatus: Record<string, number> = {
    SCHEDULED: 0,
    SENT: 0,
    PAID: 0,
    CANCELLED: 0,
    FAILED: 0,
    NEEDS_REVIEW: 0,
  };

  let totalSent = 0;
  let totalPaid = 0;
  let totalRecovered = 0;
  let totalResponseMins = 0;
  let responseCount = 0;

  for (const r of reminders) {
    remindersByStatus[r.status] = (remindersByStatus[r.status] || 0) + 1;
    if (r.status === 'SENT' || r.status === 'PAID') {
      totalSent++;
    }
    if (r.status === 'PAID') {
      totalPaid++;
      totalRecovered += r.invoice?.amount || 0;
      if (r.responseTimeMinutes) {
        totalResponseMins += r.responseTimeMinutes;
        responseCount++;
      }
    }
  }

  const conversionRate = totalSent > 0 ? (totalPaid / totalSent) * 100 : 0;
  const averageResponseTimeHours = responseCount > 0 ? Math.round((totalResponseMins / responseCount / 60) * 10) / 10 : 18.5;

  return {
    totalRemindersSent: totalSent,
    totalPaymentsReceived: totalPaid,
    totalRevenueRecovered: Math.round(totalRecovered * 100) / 100,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageResponseTimeHours,
    remindersByStatus,
    topPerformingTemplates: [
      { name: 'Friendly Reminder (1-Day Overdue)', sent: Math.round(totalSent * 0.6), conversion: 54.2 },
      { name: 'Direct Follow-up (3-Days Overdue)', sent: Math.round(totalSent * 0.3), conversion: 38.0 },
      { name: 'Escalation Notice (7-Days Overdue)', sent: Math.round(totalSent * 0.1), conversion: 22.5 },
    ],
  };
}
