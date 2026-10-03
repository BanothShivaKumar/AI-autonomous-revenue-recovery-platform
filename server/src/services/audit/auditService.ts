import { prisma } from '../../prisma/client';

export interface LogAuditParams {
  merchantId: string;
  entityType: 'TRANSACTION' | 'INVOICE' | 'CUSTOMER' | 'REMINDER' | 'ACTION_REQUEST' | 'WEBHOOK' | 'PERMISSION' | 'PAYMENT';
  entityId: string;
  action: string;
  performedBy: string; // USER, AI_AGENT, PAYPAL_WEBHOOK, PERMISSION_ENGINE
  userRole?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        merchantId: params.merchantId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedBy: params.performedBy,
        userRole: params.userRole || 'SYSTEM',
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
}
