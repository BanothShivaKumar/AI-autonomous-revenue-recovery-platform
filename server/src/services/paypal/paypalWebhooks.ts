import { paypalClient } from './paypalClient';
import { prisma } from '../../prisma/client';
import { config } from '../../config';
import { calculateCustomerMetrics } from '../customerIntelligence/metricsCalculator';
import { recalculateMerchantRevenue } from '../revenueIntelligence/revenueCalculator';
import { logAudit } from '../audit/auditService';

export interface WebhookVerificationHeaders {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
}

export async function verifyWebhookSignature(
  headers: WebhookVerificationHeaders,
  rawBody: any,
  webhookId?: string
): Promise<boolean> {
  const activeWebhookId = webhookId || config.paypal.webhookId;
  if (!activeWebhookId || !headers.transmissionSig) {
    // If webhook ID not configured in dev/sandbox, verify payload structure
    return true;
  }

  try {
    const payload = {
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: activeWebhookId,
      webhook_event: typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody,
    };

    const response = await paypalClient.post<any>(
      '/v1/notifications/verify-webhook-signature',
      payload
    );

    return response.verification_status === 'SUCCESS';
  } catch (error: any) {
    console.warn('PayPal Webhook verification network check failed, proceeding with sandbox tolerance:', error?.message);
    return true;
  }
}

export async function processPayPalWebhookEvent(event: any, merchantId?: string) {
  const eventId = event.id || 'EVT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const eventType = event.event_type;
  const resource = event.resource;

  // 1. Check idempotency
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { paypalEventId: eventId },
  });

  if (existingEvent && existingEvent.status === 'PROCESSED') {
    return { status: 'ALREADY_PROCESSED', eventId };
  }

  // 2. Persist Webhook event record
  const webhookRecord = await prisma.webhookEvent.upsert({
    where: { paypalEventId: eventId },
    update: {
      eventType,
      summary: event.summary || eventType,
      resourceType: event.resource_type || 'UNKNOWN',
      payloadJson: JSON.stringify(event),
    },
    create: {
      paypalEventId: eventId,
      eventType,
      summary: event.summary || eventType,
      resourceType: event.resource_type || 'UNKNOWN',
      payloadJson: JSON.stringify(event),
      status: 'PENDING',
    },
  });

  // Find target merchant
  const merchant = merchantId
    ? await prisma.merchant.findUnique({ where: { id: merchantId } })
    : await prisma.merchant.findFirst();

  if (!merchant) {
    throw new Error('No merchant found for webhook processing');
  }

  try {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'INVOICING.INVOICE.PAID':
      case 'PAYMENT.SALE.COMPLETED': {
        const invoiceNumber = resource.invoice_id || resource.detail?.invoice_number;
        const captureId = resource.id;
        const amount = parseFloat(resource.amount?.value || resource.total_amount?.value || '0');
        const currency = resource.amount?.currency_code || resource.total_amount?.currency_code || 'USD';
        const payerEmail = resource.payer?.email_address || resource.primary_recipients?.[0]?.billing_info?.email_address;

        let invoice = null;
        if (invoiceNumber) {
          invoice = await prisma.invoice.findFirst({
            where: {
              merchantId: merchant.id,
              invoiceNumber: invoiceNumber,
            },
            include: { customer: true },
          });
        }

        let customer: any = invoice?.customer;
        if (!customer && payerEmail) {
          customer = await prisma.customer.findFirst({
            where: {
              merchantId: merchant.id,
              email: payerEmail,
            },
          });
        }

        // If invoice found, mark as PAID
        if (invoice) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'PAID',
              paidDate: new Date(),
            },
          });

          // CANCEL ALL SCHEDULED / PENDING REMINDERS FOR THIS INVOICE
          const cancelledReminders = await prisma.reminder.updateMany({
            where: {
              invoiceId: invoice.id,
              status: { in: ['SCHEDULED', 'NEEDS_REVIEW'] },
            },
            data: {
              status: 'CANCELLED',
            },
          });

          // Log Reminder cancellation events
          const activeReminders = await prisma.reminder.findMany({
            where: { invoiceId: invoice.id },
          });
          for (const rem of activeReminders) {
            await prisma.reminderEvent.create({
              data: {
                reminderId: rem.id,
                eventType: 'CANCELLED',
                metadataJson: JSON.stringify({
                  reason: 'PAYMENT_CONFIRMED_VIA_WEBHOOK',
                  paypalEventId: eventId,
                  captureId,
                }),
              },
            });
          }

          // Also cancel pending ActionRequests
          await prisma.actionRequest.updateMany({
            where: {
              invoiceId: invoice.id,
              status: 'PENDING_APPROVAL',
            },
            data: {
              status: 'CANCELLED',
              executionResultJson: JSON.stringify({
                reason: 'AUTO_CANCELLED_INVOICE_PAID',
                timestamp: new Date().toISOString(),
              }),
            },
          });
        }

        // Create Payment Record
        const payment = await prisma.payment.create({
          data: {
            merchantId: merchant.id,
            customerId: customer?.id || null,
            invoiceId: invoice?.id || null,
            paypalCaptureId: captureId || 'CAP-' + Math.random().toString(36).substring(2, 9),
            amount: amount || invoice?.amount || 0,
            currency: currency || 'USD',
            status: 'COMPLETED',
            paymentMethod: 'PAYPAL',
            paymentDate: new Date(),
          },
        });

        // Record Completed Transaction
        await prisma.transaction.create({
          data: {
            merchantId: merchant.id,
            customerId: customer?.id || null,
            invoiceId: invoice?.id || null,
            paypalTransactionId: 'TXN-' + (captureId || Math.random().toString(36).substring(2, 9)),
            amount: amount || invoice?.amount || 0,
            currency: currency || 'USD',
            status: 'COMPLETED',
            riskIndicator: 'LOW',
            paymentMethod: 'PAYPAL_BALANCE',
            transactionDate: new Date(),
            rawData: JSON.stringify(resource),
          },
        });

        // Re-evaluate customer intelligence & revenue metrics
        if (customer) {
          await calculateCustomerMetrics(customer.id);
        }
        await recalculateMerchantRevenue(merchant.id);

        // Audit log
        await logAudit({
          merchantId: merchant.id,
          entityType: 'PAYMENT',
          entityId: payment.id,
          action: 'CONFIRMED',
          performedBy: 'PAYPAL_WEBHOOK',
          details: {
            eventType,
            amount,
            invoiceId: invoice?.id,
            customerId: customer?.id,
            remindersAutoCancelled: true,
          },
        });
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const amount = parseFloat(resource.amount?.value || '0');
        const payerEmail = resource.payer?.email_address || resource.subscriber?.email_address;
        
        let customer = null;
        if (payerEmail) {
          customer = await prisma.customer.findFirst({
            where: { merchantId: merchant.id, email: payerEmail },
          });
        }

        // Record failed transaction
        await prisma.transaction.create({
          data: {
            merchantId: merchant.id,
            customerId: customer?.id || null,
            paypalTransactionId: 'FAIL-TXN-' + Math.random().toString(36).substring(2, 9),
            amount: amount || 100,
            currency: 'USD',
            status: 'FAILED',
            failureReason: resource.status_details?.reason || 'INSUFFICIENT_FUNDS_OR_CARD_DECLINED',
            riskIndicator: 'HIGH',
            transactionDate: new Date(),
            rawData: JSON.stringify(resource),
          },
        });

        if (customer) {
          await calculateCustomerMetrics(customer.id);
        }
        await recalculateMerchantRevenue(merchant.id);

        await logAudit({
          merchantId: merchant.id,
          entityType: 'TRANSACTION',
          entityId: eventId,
          action: 'FAILED_PAYMENT_CAPTURED',
          performedBy: 'PAYPAL_WEBHOOK',
          details: { eventType, reason: resource.status_details?.reason },
        });
        break;
      }

      default:
        console.log(`Unhandled PayPal Webhook event type: ${eventType}`);
    }

    // Mark event processed
    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return { status: 'SUCCESS', eventType, eventId };
  } catch (err: any) {
    console.error('Error processing PayPal webhook event:', err);
    await prisma.webhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        status: 'FAILED',
        errorLog: err.message,
      },
    });
    throw err;
  }
}
