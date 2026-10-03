import { prisma } from '../../prisma/client';
import { calculateCustomerMetrics } from '../customerIntelligence/metricsCalculator';
import { analyzeCustomerBehaviorChange } from '../customerIntelligence/behaviorChangeDetector';
import { getSegmentAnalytics } from '../customerIntelligence/segmentationEngine';
import { calculateMerchantRevenue } from '../revenueIntelligence/revenueCalculator';
import { simulateRevenueScenario } from '../revenueIntelligence/scenarioSimulator';
import { prepareAndScheduleReminder } from '../reminderAgent/reminderEngine';
import { generateRecoveryPlan, executeBatchRecoveryActions } from '../recoveryAgent/recoveryStrategyEngine';
import { PermissionEngine } from '../permissionEngine/permissionEngine';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (args: any, merchantId: string) => Promise<any>;
}

export const AI_TOOLS: Record<string, ToolDefinition> = {
  get_transactions: {
    name: 'get_transactions',
    description: 'Retrieve merchant transactions with optional filters for status (COMPLETED, FAILED, etc.) and limit.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['COMPLETED', 'FAILED', 'PENDING', 'ALL'] },
        limit: { type: 'number', default: 20 },
      },
    },
    handler: async (args, merchantId) => {
      const where: any = { merchantId };
      if (args.status && args.status !== 'ALL') {
        where.status = args.status;
      }
      return await prisma.transaction.findMany({
        where,
        take: args.limit || 20,
        orderBy: { transactionDate: 'desc' },
        include: { customer: { select: { id: true, name: true, email: true } } },
      });
    },
  },

  get_customers: {
    name: 'get_customers',
    description: 'List all customers with segment classification, revenue metrics, and risk scores.',
    parameters: {
      type: 'object',
      properties: {
        segment: { type: 'string' },
        limit: { type: 'number', default: 50 },
      },
    },
    handler: async (args, merchantId) => {
      const where: any = { merchantId };
      if (args.segment) where.segment = args.segment;
      return await prisma.customer.findMany({
        where,
        take: args.limit || 50,
        orderBy: { riskScore: 'desc' },
      });
    },
  },

  get_customer_profile: {
    name: 'get_customer_profile',
    description: 'Get deep 360 profile and calculated behavioral metrics for a specific customer.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        customerName: { type: 'string' },
      },
      required: [],
    },
    handler: async (args, merchantId) => {
      let customer = null;
      if (args.customerId) {
        customer = await prisma.customer.findFirst({ where: { id: args.customerId, merchantId } });
      } else if (args.customerName) {
        customer = await prisma.customer.findFirst({
          where: {
            merchantId,
            name: { contains: args.customerName },
          },
        });
      }
      if (!customer) {
        return { error: 'Customer not found' };
      }
      return await calculateCustomerMetrics(customer.id);
    },
  },

  analyze_customer_behavior_change: {
    name: 'analyze_customer_behavior_change',
    description: 'Run the "What Changed?" analysis comparing historical vs recent payment behavior for a customer.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        customerName: { type: 'string' },
      },
    },
    handler: async (args, merchantId) => {
      let customer = null;
      if (args.customerId) {
        customer = await prisma.customer.findFirst({ where: { id: args.customerId, merchantId } });
      } else if (args.customerName) {
        customer = await prisma.customer.findFirst({
          where: {
            merchantId,
            name: { contains: args.customerName },
          },
        });
      }
      if (!customer) return { error: 'Customer not found' };
      return await analyzeCustomerBehaviorChange(customer.id);
    },
  },

  calculate_revenue_metrics: {
    name: 'calculate_revenue_metrics',
    description: 'Calculate merchant total revenue, outstanding revenue, revenue at risk, recovered revenue, and failure counts.',
    parameters: { type: 'object', properties: {} },
    handler: async (_, merchantId) => {
      return await calculateMerchantRevenue(merchantId);
    },
  },

  identify_overdue_invoices: {
    name: 'identify_overdue_invoices',
    description: 'List all currently overdue or unpaid invoices with customer details and aging days.',
    parameters: {
      type: 'object',
      properties: {
        minDaysOverdue: { type: 'number', default: 0 },
      },
    },
    handler: async (args, merchantId) => {
      const invoices = await prisma.invoice.findMany({
        where: {
          merchantId,
          status: { in: ['UNPAID', 'OVERDUE'] },
        },
        include: {
          customer: { select: { id: true, name: true, company: true, segment: true, riskScore: true } },
          reminders: true,
        },
        orderBy: { dueDate: 'asc' },
      });

      const now = Date.now();
      return invoices
        .map((inv) => ({
          ...inv,
          daysOverdue: Math.max(0, Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000)),
        }))
        .filter((inv) => inv.daysOverdue >= (args.minDaysOverdue || 0));
    },
  },

  identify_failed_payments: {
    name: 'identify_failed_payments',
    description: 'List recent failed payment transactions, decline reasons, and affected customers.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 20 },
      },
    },
    handler: async (args, merchantId) => {
      return await prisma.transaction.findMany({
        where: { merchantId, status: 'FAILED' },
        take: args.limit || 20,
        orderBy: { transactionDate: 'desc' },
        include: { customer: true },
      });
    },
  },

  identify_revenue_risk: {
    name: 'identify_revenue_risk',
    description: 'Retrieve summary of revenue at risk, high-risk customer accounts, and overdue balances.',
    parameters: { type: 'object', properties: {} },
    handler: async (_, merchantId) => {
      const rev = await calculateMerchantRevenue(merchantId);
      const atRiskCustomers = await prisma.customer.findMany({
        where: {
          merchantId,
          OR: [{ segment: 'AT_RISK' }, { riskScore: { gte: 45 } }],
        },
        include: {
          invoices: { where: { status: { in: ['UNPAID', 'OVERDUE'] } } },
        },
      });
      return {
        revenueAtRisk: rev.revenueAtRisk,
        outstandingRevenue: rev.outstandingRevenue,
        overdueInvoicesCount: rev.overdueInvoicesCount,
        atRiskCustomersCount: atRiskCustomers.length,
        atRiskCustomers: atRiskCustomers.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company,
          riskScore: c.riskScore,
          outstanding: c.invoices.reduce((s, i) => s + i.amount, 0),
        })),
      };
    },
  },

  prepare_recovery_plan: {
    name: 'prepare_recovery_plan',
    description: 'Formulate deterministic recovery strategies (reminder, merchant review, escalation) for overdue invoices.',
    parameters: {
      type: 'object',
      properties: {
        minDaysOverdue: { type: 'number', default: 3 },
      },
    },
    handler: async (args, merchantId) => {
      return await generateRecoveryPlan(merchantId, args.minDaysOverdue || 3);
    },
  },

  execute_batch_recovery: {
    name: 'execute_batch_recovery',
    description: 'Prepare and stage recovery actions into the Action Center for overdue invoices (honors Permission Engine).',
    parameters: {
      type: 'object',
      properties: {
        minDaysOverdue: { type: 'number', default: 3 },
      },
    },
    handler: async (args, merchantId) => {
      return await executeBatchRecoveryActions(merchantId, args.minDaysOverdue || 3);
    },
  },

  simulate_recovery_scenario: {
    name: 'simulate_recovery_scenario',
    description: 'Simulate revenue recovery outcomes under various target percentages (e.g. 30% recovery).',
    parameters: {
      type: 'object',
      properties: {
        recoveryRatePercent: { type: 'number', default: 30 },
      },
    },
    handler: async (args, merchantId) => {
      return await simulateRevenueScenario(merchantId, args.recoveryRatePercent || 30);
    },
  },

  get_reminder_policy: {
    name: 'get_reminder_policy',
    description: 'Get merchant reminder policies and threshold configuration.',
    parameters: { type: 'object', properties: {} },
    handler: async (_, merchantId) => {
      return await prisma.reminderPolicy.findFirst({
        where: { merchantId, isDefault: true },
      });
    },
  },
};
