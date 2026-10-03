import { describe, it, expect, beforeAll } from 'vitest';
import { PermissionEngine } from '../services/permissionEngine/permissionEngine';
import { calculateCustomerMetrics } from '../services/customerIntelligence/metricsCalculator';
import { analyzeCustomerBehaviorChange } from '../services/customerIntelligence/behaviorChangeDetector';
import { calculateMerchantRevenue } from '../services/revenueIntelligence/revenueCalculator';
import { processPayPalWebhookEvent } from '../services/paypal/paypalWebhooks';
import { prepareAndScheduleReminder } from '../services/reminderAgent/reminderEngine';
import { AIAgentService } from '../services/ai/aiAgentService';
import { seedDemoBusiness } from '../services/demo/demoSeeder';
import { prisma } from '../prisma/client';

describe('PayPilot Revenue Recovery & Customer Intelligence Core Engine Tests', { timeout: 30000 }, () => {
  let merchantId: string;
  let alexCustomerId: string;
  let alexInvoiceId: string;


  beforeAll(async () => {
    let merchant = await prisma.merchant.findFirst({
      include: { customers: true, invoices: true },
    });
    if (!merchant || merchant.customers.length === 0) {
      await seedDemoBusiness();
      merchant = await prisma.merchant.findFirst({
        include: { customers: true, invoices: true },
      });
    }
    if (!merchant) throw new Error('No merchant found.');
    merchantId = merchant.id;

    const alex = merchant.customers.find((c) => c.name.includes('Alex'));
    if (!alex) throw new Error('Alex Technologies customer not found.');
    alexCustomerId = alex.id;

    const inv = merchant.invoices.find((i) => i.invoiceNumber === 'INV-1024');
    if (!inv) throw new Error('INV-1024 not found.');
    alexInvoiceId = inv.id;

    // Ensure invoice is in standard test baseline state (UNPAID overdue)
    await prisma.invoice.update({
      where: { id: alexInvoiceId },
      data: { status: 'UNPAID', paidDate: null },
    });
  }, 30000);



  // 1. Permission Engine Safety Test
  describe('Permission Engine & Safety Controls', () => {
    it('CRITICAL TEST: AI direct attempt at FINANCIAL tier action MUST BE BLOCKED and routed to approval', async () => {
      const result = await PermissionEngine.checkPermission({
        merchantId,
        actionType: 'capture_payment',
        requestedBy: 'AI_AGENT',
        entityId: 'test-invoice',
      });

      expect(result.allowed).toBe(false);
      expect(result.tier).toBe('FINANCIAL');
      expect(result.requiresApproval).toBe(true);
      expect(result.reason).toContain('CRITICAL SAFETY RULE');
    });

    it('READ actions are permitted for AI reasoning', async () => {
      const result = await PermissionEngine.checkPermission({
        merchantId,
        actionType: 'get_transactions',
        requestedBy: 'AI_AGENT',
      });

      expect(result.allowed).toBe(true);
      expect(result.tier).toBe('READ');
      expect(result.requiresApproval).toBe(false);
    });

    it('Authenticated Merchant Admin has direct authorization', async () => {
      const result = await PermissionEngine.checkPermission({
        merchantId,
        actionType: 'capture_payment',
        requestedBy: 'MERCHANT_ADMIN',
      });

      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });
  });

  // 2. Customer Intelligence & Metrics Calculation
  describe('Customer Intelligence Calculations', () => {
    it('Calculates deterministic behavioral metrics for Alex Technologies', async () => {
      const metrics = await calculateCustomerMetrics(alexCustomerId);

      expect(metrics.name).toBe('Alex Technologies');
      expect(metrics.totalTransactions).toBeGreaterThan(0);
      expect(metrics.failedTransactions).toBe(2);
      expect(metrics.outstandingInvoiceAmount).toBe(450);
      expect(metrics.oldestOutstandingDays).toBeGreaterThanOrEqual(4);
      expect(metrics.recentFailureCount).toBe(2);
      expect(metrics.riskScore).toBeGreaterThanOrEqual(40);
      expect(metrics.suggestedSegment).toBe('AT_RISK');
    });

    it('CRITICAL TEST: Behavior change detector identifies payment delay shift and failures', async () => {
      const change = await analyzeCustomerBehaviorChange(alexCustomerId);

      expect(change.customerName).toBe('Alex Technologies');
      expect(change.overallStatus).toBe('CRITICAL');
      expect(change.recentBehavior.failedPaymentCount).toBe(2);
      expect(change.recentBehavior.outstandingAmount).toBe(450);
      expect(change.keyFindings.length).toBeGreaterThan(0);
      expect(change.actionDetails.actionType).toBeDefined();
    });
  });

  // 3. Revenue Intelligence
  describe('Revenue Intelligence Engine', () => {
    it('Calculates merchant revenue metrics without inventing data', async () => {
      const rev = await calculateMerchantRevenue(merchantId);

      expect(rev.totalRevenue).toBeGreaterThan(30000);
      expect(rev.outstandingRevenue).toBeGreaterThan(0);
      expect(rev.revenueAtRisk).toBeGreaterThan(0);
      expect(rev.agingBuckets).toBeDefined();
      expect(rev.monthlyTrends.length).toBe(6);
    });
  });

  // 4. AI Agent Tool Calling
  describe('AI Agent & Tool Calling Engine', () => {
    it('Responds to "Why did my revenue decrease" with real backend data', async () => {
      const response = await AIAgentService.processCommand(
        'Why did my revenue decrease this month?',
        merchantId
      );

      expect(response.answer).toContain('Revenue Status');
      expect(response.answer).toContain('Failed Payments');
      expect(response.answer).toContain('Overdue Invoices');
      expect(response.toolsUsed).toContain('calculate_revenue_metrics');
      expect(response.toolData.potentialRecovery).toBeGreaterThan(0);
    });

    it('Stages recovery actions into Action Center when requested', async () => {
      const response = await AIAgentService.processCommand(
        'Prepare recovery actions for customers overdue by more than 3 days',
        merchantId
      );

      expect(response.answer).toContain('AI Revenue Recovery Actions Prepared');
      expect(response.toolsUsed).toContain('execute_batch_recovery');
      expect(response.actionStaged).toBe(true);

      const pendingActions = await prisma.actionRequest.findMany({
        where: { merchantId, status: 'PENDING_APPROVAL' },
      });
      expect(pendingActions.length).toBeGreaterThan(0);
    });
  });

  // 5. PayPal Webhook Processing & Auto-Cancellation
  describe('PayPal Webhook Feedback Loop', () => {
    it('CRITICAL TEST: When payment webhook is received, invoice is marked PAID and scheduled reminders are AUTO-CANCELLED', async () => {
      // Clear previous reminders for this invoice to prevent limit blocks during test runs
      await prisma.reminder.deleteMany({
        where: { invoiceId: alexInvoiceId },
      });

      // 1. Stage a reminder for Alex's invoice
      const stageResult = await prepareAndScheduleReminder({
        merchantId,
        invoiceId: alexInvoiceId,
        triggerSource: 'TEST_AGENT',
      });
      expect(stageResult.reminderId).toBeDefined();

      // Verify reminder exists in NEEDS_REVIEW or SCHEDULED
      const beforeReminder = await prisma.reminder.findUnique({
        where: { id: stageResult.reminderId },
      });
      expect(beforeReminder?.status).toBe('NEEDS_REVIEW');

      // 2. Simulate PayPal PAYMENT.CAPTURE.COMPLETED webhook event
      const testTimestamp = Date.now();
      const webhookPayload = {
        id: 'WH-TEST-' + testTimestamp,
        event_version: '1.0',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAP-TEST-' + testTimestamp,
          invoice_id: 'INV-1024',
          amount: { value: '450.00', currency_code: 'USD' },
          payer: { email_address: 'alex@alextech.io' },
        },
      };

      const webhookResult = await processPayPalWebhookEvent(webhookPayload, merchantId);
      expect(webhookResult.status).toBe('SUCCESS');

      // 3. Verify invoice is marked PAID
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: alexInvoiceId },
      });
      expect(updatedInvoice?.status).toBe('PAID');
      expect(updatedInvoice?.paidDate).toBeDefined();

      // 4. Verify reminder was AUTOMATICALLY CANCELLED
      const cancelledReminder = await prisma.reminder.findUnique({
        where: { id: stageResult.reminderId },
      });
      expect(cancelledReminder?.status).toBe('CANCELLED');

      // 5. Verify Audit Log was recorded
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          merchantId,
          action: 'CONFIRMED',
          performedBy: 'PAYPAL_WEBHOOK',
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(auditLog).toBeDefined();
    });
  });
});
