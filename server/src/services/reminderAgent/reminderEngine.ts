import { prisma } from '../../prisma/client';
import { PermissionEngine } from '../permissionEngine/permissionEngine';
import { sendPayPalInvoiceReminder } from '../paypal/paypalInvoices';
import { logAudit } from '../audit/auditService';

export interface GenerateReminderParams {
  merchantId: string;
  invoiceId: string;
  reminderNumber?: number;
  triggerSource?: string;
  customMessage?: string;
}

export async function generatePersonalizedReminderMessage(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      merchant: true,
      reminders: true,
    },
  });

  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  const customerName = invoice.customer.name;
  const merchantName = invoice.merchant.name || 'Nova Digital Studio';
  const invoiceNumber = invoice.invoiceNumber;
  const amountFormatted = `$${invoice.amount.toFixed(2)}`;
  const reminderCount = invoice.reminders.length + 1;

  if (reminderCount === 1) {
    return `Hi ${customerName},

Just a friendly reminder that invoice #${invoiceNumber} for ${amountFormatted} is currently outstanding.

You can complete your payment securely through your PayPal account or via the direct invoice link:
https://www.sandbox.paypal.com/invoice/p/#${invoice.paypalInvoiceId || invoiceNumber}

Thank you,
${merchantName}`;
  } else if (reminderCount === 2) {
    return `Hi ${customerName},

We are following up regarding invoice #${invoiceNumber} for ${amountFormatted}, which is now overdue.

Please take a moment to review and complete the payment through PayPal:
https://www.sandbox.paypal.com/invoice/p/#${invoice.paypalInvoiceId || invoiceNumber}

If you have already submitted this payment or need assistance with alternative payment options, please reply to let us know.

Best regards,
${merchantName}`;
  } else {
    return `URGENT: Outstanding Balance for Invoice #${invoiceNumber}

Dear ${customerName},

This is an important reminder that invoice #${invoiceNumber} in the amount of ${amountFormatted} remains unpaid.

Please settle this balance promptly via PayPal:
https://www.sandbox.paypal.com/invoice/p/#${invoice.paypalInvoiceId || invoiceNumber}

If you require support or wish to discuss payment arrangements, please contact our billing department immediately.

Sincerely,
${merchantName}`;
  }
}

export async function prepareAndScheduleReminder(params: GenerateReminderParams) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { customer: true, merchant: true, reminders: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'PAID') {
    throw new Error('Invoice is already marked as PAID. Reminders cannot be generated for settled invoices.');
  }

  const policy = await prisma.reminderPolicy.findFirst({
    where: { merchantId: params.merchantId, isDefault: true },
  });

  const maxReminders = policy?.maxReminders || 3;
  const existingRemindersCount = invoice.reminders.length;
  if (existingRemindersCount >= maxReminders) {
    return {
      status: 'MAX_LIMIT_REACHED',
      message: `Invoice #${invoice.invoiceNumber} has already reached the maximum allowed reminders (${maxReminders}). Escalating to Merchant Review.`,
    };
  }

  const messageContent = params.customMessage || (await generatePersonalizedReminderMessage(invoice.id));
  const reminderNumber = existingRemindersCount + 1;

  // Check Permission Engine
  const permCheck = await PermissionEngine.checkPermission({
    merchantId: params.merchantId,
    actionType: 'send_reminder',
    requestedBy: 'AI_AGENT',
    entityId: invoice.id,
    payload: { reminderNumber, messageContent },
  });

  if (permCheck.requiresApproval) {
    // Stage in Action Request
    const actionRequest = await prisma.actionRequest.create({
      data: {
        merchantId: params.merchantId,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        actionType: 'SEND_REMINDER',
        permissionTier: 'COMMUNICATION',
        status: 'PENDING_APPROVAL',
        proposedPayloadJson: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          reminderNumber,
          messageContent,
          recipientEmail: invoice.customer.email,
        }),
        reasoning: `Invoice #${invoice.invoiceNumber} ($${invoice.amount}) is overdue. Customer segment: ${invoice.customer.segment}. Recommended step: Stage friendly reminder #${reminderNumber}.`,
        riskAnalysis: `Low communication risk. Customer on-time rate: ${invoice.customer.riskScore < 30 ? 'High' : 'Moderate'}.`,
        requestedBy: 'AI_REMINDER_AGENT',
      },
    });

    // Create Reminder in NEEDS_REVIEW status
    const reminder = await prisma.reminder.create({
      data: {
        merchantId: params.merchantId,
        customerId: invoice.customerId,
        invoiceId: invoice.id,
        reminderNumber,
        channel: 'EMAIL',
        status: 'NEEDS_REVIEW',
        scheduledFor: new Date(),
        messageContent,
        triggerSource: params.triggerSource || 'AUTO_AGENT',
      },
    });

    await prisma.reminderEvent.create({
      data: {
        reminderId: reminder.id,
        eventType: 'SCHEDULED',
        metadataJson: JSON.stringify({ actionRequestId: actionRequest.id, requiresApproval: true }),
      },
    });

    await logAudit({
      merchantId: params.merchantId,
      entityType: 'REMINDER',
      entityId: reminder.id,
      action: 'STAGED_FOR_APPROVAL',
      performedBy: 'AI_AGENT',
      details: { invoiceId: invoice.id, actionRequestId: actionRequest.id },
    });

    return {
      status: 'STAGED_FOR_APPROVAL',
      actionRequestId: actionRequest.id,
      reminderId: reminder.id,
      message: 'Reminder prepared and staged in Action Center for merchant review.',
    };
  }

  // If approval not required (auto-send policy)
  const reminder = await prisma.reminder.create({
    data: {
      merchantId: params.merchantId,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      reminderNumber,
      channel: 'EMAIL',
      status: 'SENT',
      scheduledFor: new Date(),
      sentAt: new Date(),
      messageContent,
      triggerSource: params.triggerSource || 'AUTO_AGENT',
    },
  });

  if (invoice.paypalInvoiceId) {
    await sendPayPalInvoiceReminder(invoice.paypalInvoiceId, messageContent);
  }

  await prisma.reminderEvent.create({
    data: {
      reminderId: reminder.id,
      eventType: 'SENT',
      metadataJson: JSON.stringify({ sentVia: 'PAYPAL_AND_EMAIL', direct: true }),
    },
  });

  await logAudit({
    merchantId: params.merchantId,
    entityType: 'REMINDER',
    entityId: reminder.id,
    action: 'SENT_AUTONOMOUSLY',
    performedBy: 'AI_AGENT',
    details: { invoiceId: invoice.id, reminderNumber },
  });

  return {
    status: 'SENT',
    reminderId: reminder.id,
    message: 'Reminder sent successfully to customer.',
  };
}
