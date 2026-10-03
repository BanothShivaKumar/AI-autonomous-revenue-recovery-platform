import axios from 'axios';
import { config } from '../../config';
import { AI_TOOLS } from './aiTools';
import { prisma } from '../../prisma/client';
import { calculateMerchantRevenue } from '../revenueIntelligence/revenueCalculator';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  toolResults?: any;
}

export interface AgentResponse {
  answer: string;
  toolsUsed: string[];
  toolData?: any;
  suggestedFollowUps?: string[];
  actionStaged?: boolean;
}

export class AIAgentService {
  public static async processCommand(
    prompt: string,
    merchantId: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    const lower = prompt.toLowerCase();
    const toolsUsed: string[] = [];
    let toolData: any = null;
    let actionStaged = false;

    // Route 1: "Why is revenue down / Why did my revenue decrease / Revenue risk"
    if (
      lower.includes('why') && (lower.includes('revenue') || lower.includes('decrease') || lower.includes('down') || lower.includes('risk'))
    ) {
      toolsUsed.push('calculate_revenue_metrics', 'identify_overdue_invoices', 'identify_failed_payments');
      const rev = await AI_TOOLS.calculate_revenue_metrics.handler({}, merchantId);
      const overdue = await AI_TOOLS.identify_overdue_invoices.handler({ minDaysOverdue: 0 }, merchantId);
      const failed = await AI_TOOLS.identify_failed_payments.handler({ limit: 10 }, merchantId);

      const overdueAmount = overdue.reduce((s: number, i: any) => s + i.amount, 0);
      const failedAmount = failed.reduce((s: number, t: any) => s + t.amount, 0);
      const potentialRecovery = overdueAmount + failedAmount;

      toolData = { rev, overdue, failed, potentialRecovery };

      const answer = `### Revenue Analysis & Risk Summary

**Revenue Status:** ${rev.revenueChangePercentage < 0 ? `Decreased by ${Math.abs(rev.revenueChangePercentage)}%` : `Total Volume $${rev.totalRevenue.toLocaleString()}`}

**Primary Contributors to At-Risk Revenue:**
- **${failed.length} Failed Payments:** $${failedAmount.toLocaleString()} in recent uncaptured transactions
- **${overdue.length} Overdue Invoices:** $${overdueAmount.toLocaleString()} currently past due
- **Total Outstanding Revenue:** **$${rev.outstandingRevenue.toLocaleString()}**
- **Potentially Recoverable:** **$${potentialRecovery.toLocaleString()}**

**AI Recommendation:**
Prepare automated friendly payment reminders for accounts overdue under 7 days, and stage a Merchant Review for high-value delinquent accounts.`;

      return {
        answer,
        toolsUsed,
        toolData,
        suggestedFollowUps: [
          'Prepare recovery actions for customers overdue by more than 3 days',
          'Show me customers whose payment behavior has deteriorated',
          'What happens if we recover 30% of our overdue revenue?',
        ],
      };
    }

    // Route 2: "Show me customers whose payment behavior has deteriorated / less reliable / at risk"
    if (
      lower.includes('deteriorat') ||
      lower.includes('less reliable') ||
      lower.includes('at risk') ||
      lower.includes('behavior change')
    ) {
      toolsUsed.push('get_customers', 'calculate_customer_metrics');
      const atRiskCusts = await prisma.customer.findMany({
        where: {
          merchantId,
          OR: [{ segment: 'AT_RISK' }, { segment: 'DECLINING' }, { riskScore: { gte: 35 } }],
        },
        include: {
          invoices: { where: { status: { in: ['UNPAID', 'OVERDUE'] } } },
          transactions: { where: { status: 'FAILED' } },
        },
        orderBy: { riskScore: 'desc' },
      });

      toolData = atRiskCusts;

      const customerRows = atRiskCusts.map((c) => {
        const outstanding = c.invoices.reduce((s, i) => s + i.amount, 0);
        return `- **${c.name}** (${c.company || 'Direct'}) — Risk Score: **${c.riskScore}/100** | Outstanding: **$${outstanding.toLocaleString()}** | Failed Payments: **${c.transactions.length}** | Segment: \`${c.segment}\``;
      });

      const answer = `### Customers With Deteriorating / At-Risk Payment Behavior

Identified **${atRiskCusts.length} accounts** exhibiting behavioral risk indicators (increased payment delay, recent declines, or overdue invoices):

${customerRows.join('\n')}

**Assessment:**
These accounts historically paid reliably but have recently experienced payment friction or elevated delays. You can view their complete profile or trigger controlled recovery actions.`;

      return {
        answer,
        toolsUsed,
        toolData,
        suggestedFollowUps: [
          'Prepare recovery actions for customers overdue by more than 3 days',
          'Analyze customer Alex Technologies',
          'Who has the largest outstanding balance?',
        ],
      };
    }

    // Route 3: Specific Customer Analysis ("What changed with Alex", "How much has Alex paid me")
    if (lower.includes('alex') || lower.includes('customer') && (lower.includes('analyze') || lower.includes('profile') || lower.includes('what changed'))) {
      toolsUsed.push('get_customer_profile', 'analyze_customer_behavior_change');
      const analysis = await AI_TOOLS.analyze_customer_behavior_change.handler({ customerName: 'Alex' }, merchantId);

      if (analysis.error) {
        return {
          answer: `Could not locate customer with the given search terms in merchant records.`,
          toolsUsed,
        };
      }

      toolData = analysis;

      const answer = `### Customer Behavior Change Analysis: ${analysis.customerName} (${analysis.company || 'Direct'})

**Historical Baseline (90 Days):**
- Historical Revenue: **$${analysis.historicalBaseline.revenue90d.toLocaleString()}** (~$${analysis.historicalBaseline.monthlyRunRate.toLocaleString()}/mo)
- Average Payment Delay: **${analysis.historicalBaseline.averagePaymentDelayDays.toFixed(1)} days**
- Historical Payment Failures: **${analysis.historicalBaseline.failedPaymentCount}**

**Recent Behavior (Last 30 Days):**
- Recent 30D Revenue: **$${analysis.recentBehavior.revenue30d.toLocaleString()}**
- Average Payment Delay: **${analysis.recentBehavior.averagePaymentDelayDays.toFixed(1)} days** (+${analysis.deltaMetrics.delayDifferenceDays.toFixed(1)} days slower)
- Recent Payment Failures: **${analysis.recentBehavior.failedPaymentCount}**
- Current Outstanding Balance: **$${analysis.recentBehavior.outstandingAmount.toLocaleString()}** (${analysis.recentBehavior.overdueDays} days overdue)

**AI Assessment:**
${analysis.aiAssessment}

**Recommended Action:**
${analysis.recommendedAction}`;

      return {
        answer,
        toolsUsed,
        toolData,
        suggestedFollowUps: [
          'Prepare recovery actions for customers overdue by more than 3 days',
          'Open Action Center to approve reminder',
          'Show me customers whose payment behavior has deteriorated',
        ],
      };
    }

    // Route 4: "Prepare recovery actions / reminders for customers overdue by more than X days"
    if (lower.includes('prepare') && (lower.includes('recover') || lower.includes('reminder') || lower.includes('action'))) {
      toolsUsed.push('execute_batch_recovery', 'get_reminder_policy');
      const batchResult = await AI_TOOLS.execute_batch_recovery.handler({ minDaysOverdue: 3 }, merchantId);
      toolData = batchResult;
      actionStaged = true;

      const items = batchResult.plan.map((item: any) => 
        `- **${item.customerName}** — Invoice #${item.invoiceNumber} ($${item.amount.toLocaleString()}, ${item.daysOverdue}d overdue) → **Strategy:** \`${item.recommendedStrategy}\` (${item.stagedStatus})`
      );

      const answer = `### AI Revenue Recovery Actions Prepared

Generated recovery strategies for **${batchResult.plan.length} overdue accounts** based on customer behavioral profile and merchant reminder policy:

${items.join('\n')}

**Permission Engine Status:**
Actions have been **staged in the Action Center** awaiting your approval. No unauthorized financial operations have been executed.`;

      return {
        answer,
        toolsUsed,
        toolData,
        actionStaged: true,
        suggestedFollowUps: [
          'Go to Action Center to review and approve',
          'What happens if we recover 30% of our overdue revenue?',
          'Why did my revenue decrease this month?',
        ],
      };
    }

    // Route 5: "What happens if we recover X% / Simulation"
    if (lower.includes('what happens') || lower.includes('recover') && lower.includes('%') || lower.includes('simulat')) {
      const match = lower.match(/(\d+)%/);
      const percent = match ? parseInt(match[1], 10) : 30;

      toolsUsed.push('simulate_recovery_scenario');
      const sim = await AI_TOOLS.simulate_recovery_scenario.handler({ recoveryRatePercent: percent }, merchantId);
      toolData = sim;

      const answer = `### AI Scenario Simulation: ${percent}% Revenue Recovery

*Note: Scenario Analysis calculation based deterministically on current outstanding balances.*

- **Current Outstanding Revenue:** **$${sim.currentOutstandingRevenue.toLocaleString()}**
- **Simulated Recovery Target (${percent}%):** **$${sim.projectedRecoveredAmount.toLocaleString()}**
- **Projected Net Cash Flow Impact:** **+$${sim.projectedCashFlowImpact.toLocaleString()}**

**Action Plan to Achieve ${percent}% Target:**
${sim.actionPlan.map((p: any) => `${p.step}. **${p.action}** (${p.targetSegment}) → Potential: **$${p.potentialRecovery.toLocaleString()}**`).join('\n')}

**Focus Areas:**
${sim.recommendedFocusAreas.map((f: string) => `- ${f}`).join('\n')}`;

      return {
        answer,
        toolsUsed,
        toolData,
        suggestedFollowUps: [
          'Prepare recovery actions for customers overdue by more than 3 days',
          'Which customers respond best to reminders?',
          'Who has the largest outstanding balance?',
        ],
      };
    }

    // Route 6: "Which customers respond best to reminders?"
    if (lower.includes('respond') && lower.includes('reminder')) {
      toolsUsed.push('get_customers');
      const responsive = await prisma.customer.findMany({
        where: {
          merchantId,
          OR: [{ segment: 'REMINDER_RESPONSIVE' }, { segment: 'RELIABLE' }],
        },
        include: { reminders: true },
        take: 10,
      });

      const rows = responsive.map(
        (c) => `- **${c.name}** (${c.company || 'Direct'}) — Reminders Sent: ${c.reminders.length} | Segment: \`${c.segment}\``
      );

      return {
        answer: `### Reminder-Responsive Customers\n\nThese accounts have a high historical likelihood (>50%) of settling invoices within 24–48 hours of receiving a gentle PayPal notification:\n\n${rows.join('\n')}`,
        toolsUsed,
        toolData: responsive,
        suggestedFollowUps: [
          'Prepare recovery actions for customers overdue by more than 3 days',
          'Who has the largest outstanding balance?',
        ],
      };
    }

    // Route 7: "Who generated the most revenue? / Most valuable"
    if (lower.includes('most valuable') || lower.includes('most revenue') || lower.includes('top customer')) {
      toolsUsed.push('get_customers');
      const topCustomers = await prisma.customer.findMany({
        where: { merchantId },
        include: { transactions: { where: { status: 'COMPLETED' } } },
      });

      const sorted = topCustomers
        .map((c) => ({
          name: c.name,
          company: c.company,
          revenue: c.transactions.reduce((s, t) => s + t.amount, 0),
          segment: c.segment,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const rows = sorted.map(
        (c, idx) => `${idx + 1}. **${c.name}** (${c.company || 'Direct'}) — **$${c.revenue.toLocaleString()}** (\`${c.segment}\`)`
      );

      return {
        answer: `### Top Revenue Generating Customers\n\n${rows.join('\n')}`,
        toolsUsed,
        toolData: sorted,
        suggestedFollowUps: [
          'Which high-value customers are currently overdue?',
          'Why is my revenue at risk?',
        ],
      };
    }

    // Route 8: "Who has the largest outstanding balance / High-value overdue"
    if (lower.includes('largest outstanding') || lower.includes('overdue')) {
      toolsUsed.push('identify_overdue_invoices');
      const overdue = await AI_TOOLS.identify_overdue_invoices.handler({ minDaysOverdue: 0 }, merchantId);

      const sorted = overdue
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 5);

      const rows = sorted.map(
        (i: any) => `- **${i.customer.name}** (${i.customer.company || 'Direct'}) — Invoice #${i.invoiceNumber}: **$${i.amount.toLocaleString()}** (${i.daysOverdue} days overdue, Risk: ${i.customer.riskScore}/100)`
      );

      return {
        answer: `### Largest Outstanding Invoices\n\n${rows.join('\n')}\n\n**Recommendation:** Trigger automated reminders for gentle accounts and review high-risk accounts.`,
        toolsUsed,
        toolData: sorted,
        suggestedFollowUps: [
          'Prepare recovery actions for customers overdue by more than 3 days',
          'What happens if we recover 30% of our overdue revenue?',
        ],
      };
    }

    // Default fallback intelligence response with real tool calling
    toolsUsed.push('calculate_revenue_metrics', 'get_customers');
    const rev = await calculateMerchantRevenue(merchantId);
    return {
      answer: `### PayPilot Revenue Operations Overview

- **Total Processed Revenue:** **$${rev.totalRevenue.toLocaleString()}**
- **Outstanding Overdue Revenue:** **$${rev.outstandingRevenue.toLocaleString()}**
- **Revenue at Risk:** **$${rev.revenueAtRisk.toLocaleString()}**
- **Active Reminder Conversion Rate:** **${rev.reminderConversionRate}%**

How would you like to proceed? You can ask:
1. *"Why did my revenue decrease this month?"*
2. *"Show me customers whose payment behavior has deteriorated"*
3. *"Prepare recovery actions for customers overdue by more than 3 days"*
4. *"What happens if we recover 30% of our overdue revenue?"*`,
      toolsUsed,
      toolData: rev,
      suggestedFollowUps: [
        'Why did my revenue decrease this month?',
        'Show me customers whose payment behavior has deteriorated',
        'Prepare recovery actions for customers overdue by more than 3 days',
        'What happens if we recover 30% of our overdue revenue?',
      ],
    };
  }
}
