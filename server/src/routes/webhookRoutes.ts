import { Router, Request, Response } from 'express';
import { verifyWebhookSignature, processPayPalWebhookEvent } from '../services/paypal/paypalWebhooks';
import { prisma } from '../prisma/client';

const router = Router();

// Official PayPal Webhook Endpoint
router.post('/paypal', async (req: Request, res: Response): Promise<void> => {
  try {
    const headers = {
      authAlgo: req.headers['paypal-auth-algo'] as string,
      certUrl: req.headers['paypal-cert-url'] as string,
      transmissionId: req.headers['paypal-transmission-id'] as string,
      transmissionSig: req.headers['paypal-transmission-sig'] as string,
      transmissionTime: req.headers['paypal-transmission-time'] as string,
    };

    const isValid = await verifyWebhookSignature(headers, req.body);
    if (!isValid) {
      res.status(400).json({ error: 'Webhook signature verification failed' });
      return;
    }

    const result = await processPayPalWebhookEvent(req.body);
    res.json({ received: true, result });
  } catch (err: any) {
    console.error('Webhook endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Hackathon Demo Simulator: Simulate PayPal Event
router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventType, invoiceNumber, customerEmail, amount, merchantId } = req.body;

    const targetMerchant = merchantId
      ? await prisma.merchant.findUnique({ where: { id: merchantId } })
      : await prisma.merchant.findFirst();

    if (!targetMerchant) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }

    const activeInvoiceNumber = invoiceNumber || 'INV-1024';
    const invoice = await prisma.invoice.findFirst({
      where: { merchantId: targetMerchant.id, invoiceNumber: activeInvoiceNumber },
      include: { customer: true },
    });

    const mockEvent = {
      id: 'WH-SIM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      event_version: '1.0',
      create_time: new Date().toISOString(),
      event_type: eventType || 'PAYMENT.CAPTURE.COMPLETED',
      summary: `Payment completed for Invoice #${activeInvoiceNumber}`,
      resource_type: 'capture',
      resource: {
        id: 'CAP-SIM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        invoice_id: activeInvoiceNumber,
        status: 'COMPLETED',
        amount: {
          value: (amount || invoice?.amount || 450).toFixed(2),
          currency_code: 'USD',
        },
        payer: {
          email_address: customerEmail || invoice?.customer?.email || 'alex@alextech.io',
          name: { given_name: invoice?.customer?.name || 'Alex' },
        },
      },
    };

    const result = await processPayPalWebhookEvent(mockEvent, targetMerchant.id);
    res.json({
      message: `Simulated PayPal Webhook event '${mockEvent.event_type}' processed successfully!`,
      mockEvent,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
