import { prisma } from '../../prisma/client';
import { logAudit } from '../audit/auditService';

export type PermissionTier = 'READ' | 'COMMUNICATION' | 'LOW_RISK' | 'FINANCIAL';

export interface PermissionCheckRequest {
  merchantId: string;
  actionType: string;
  requestedBy: 'AI_AGENT' | 'MERCHANT_ADMIN' | 'SYSTEM' | 'PAYPAL_WEBHOOK';
  entityId?: string;
  payload?: any;
}

export interface PermissionCheckResult {
  allowed: boolean;
  tier: PermissionTier;
  requiresApproval: boolean;
  reason: string;
}

export const ACTION_TIER_MAP: Record<string, PermissionTier> = {
  // READ
  get_transactions: 'READ',
  get_transaction_details: 'READ',
  get_customers: 'READ',
  get_customer_profile: 'READ',
  get_customer_payment_history: 'READ',
  get_invoices: 'READ',
  get_invoice_details: 'READ',
  get_subscriptions: 'READ',
  calculate_revenue_metrics: 'READ',
  calculate_customer_metrics: 'READ',
  identify_overdue_invoices: 'READ',
  identify_failed_payments: 'READ',
  identify_revenue_risk: 'READ',
  get_reminder_policy: 'READ',
  get_reminder_history: 'READ',
  analyze_customer: 'READ',

  // COMMUNICATION
  prepare_reminder: 'COMMUNICATION',
  generate_reminder_content: 'COMMUNICATION',
  send_reminder: 'COMMUNICATION',

  // LOW_RISK
  schedule_reminder: 'LOW_RISK',
  cancel_reminder: 'LOW_RISK',
  create_invoice: 'LOW_RISK',
  send_invoice: 'LOW_RISK',

  // FINANCIAL
  capture_payment: 'FINANCIAL',
  refund_payment: 'FINANCIAL',
  charge_card: 'FINANCIAL',
  suspend_subscription: 'FINANCIAL',
  modify_billing_terms: 'FINANCIAL',
};

export class PermissionEngine {
  public static getActionTier(actionType: string): PermissionTier {
    return ACTION_TIER_MAP[actionType] || 'FINANCIAL'; // Default to strictest FINANCIAL if unknown
  }

  public static async checkPermission(req: PermissionCheckRequest): Promise<PermissionCheckResult> {
    const tier = this.getActionTier(req.actionType);

    // Human merchant admin has full permission for permitted operations
    if (req.requestedBy === 'MERCHANT_ADMIN') {
      return {
        allowed: true,
        tier,
        requiresApproval: false,
        reason: 'Authorized by authenticated Merchant Administrator.',
      };
    }

    // System/Webhook internal operations
    if (req.requestedBy === 'PAYPAL_WEBHOOK' || req.requestedBy === 'SYSTEM') {
      return {
        allowed: true,
        tier,
        requiresApproval: false,
        reason: 'Authorized by verified PayPal event dispatcher.',
      };
    }

    // AI_AGENT Permissions
    if (req.requestedBy === 'AI_AGENT') {
      // 1. READ tier is always allowed for AI analysis
      if (tier === 'READ') {
        return {
          allowed: true,
          tier,
          requiresApproval: false,
          reason: 'Read-only analytics operations are permitted for AI reasoning.',
        };
      }

      // 2. FINANCIAL tier is NEVER directly executable by AI autonomously
      if (tier === 'FINANCIAL') {
        await logAudit({
          merchantId: req.merchantId,
          entityType: 'PERMISSION',
          entityId: req.entityId || 'financial-action',
          action: 'FINANCIAL_ACTION_BLOCKED_FOR_APPROVAL',
          performedBy: 'PERMISSION_ENGINE',
          details: {
            actionType: req.actionType,
            reason: 'AI attempted direct financial execution. Routed to human Action Center.',
          },
        });

        return {
          allowed: false,
          tier,
          requiresApproval: true,
          reason: 'CRITICAL SAFETY RULE: AI Agent cannot directly execute financial actions (capture, refund, charge). Action must be staged in the Action Center for explicit merchant approval.',
        };
      }

      // 3. COMMUNICATION and LOW_RISK check Merchant Policy
      const policy = await prisma.reminderPolicy.findFirst({
        where: { merchantId: req.merchantId, isDefault: true },
      });

      const requireApproval = policy ? policy.requireApproval : true;

      if (requireApproval && (req.actionType === 'send_reminder' || req.actionType === 'schedule_reminder')) {
        return {
          allowed: false,
          tier,
          requiresApproval: true,
          reason: 'Merchant policy requires human-in-the-loop review before sending communications to customers.',
        };
      }

      return {
        allowed: true,
        tier,
        requiresApproval: false,
        reason: 'Action conforms with merchant automated policy parameters.',
      };
    }

    return {
      allowed: false,
      tier,
      requiresApproval: true,
      reason: 'Unknown requestor source.',
    };
  }
}
