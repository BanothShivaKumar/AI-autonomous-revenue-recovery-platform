import { Router, Request, Response } from 'express';
import { seedDemoBusiness } from '../services/demo/demoSeeder';
import { prisma } from '../prisma/client';

const router = Router();

// Reset & Seed Nova Digital Studio
router.post('/seed', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await seedDemoBusiness();
    res.json({
      message: 'Nova Digital Studio demo business data initialized successfully!',
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Demo Scenario Status
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const merchant = await prisma.merchant.findFirst({
      include: {
        customers: true,
        invoices: true,
        transactions: true,
        reminders: true,
        actionRequests: true,
      },
    });

    if (!merchant) {
      res.json({ seeded: false });
      return;
    }

    const alexCust = merchant.customers.find((c) => c.name.includes('Alex'));
    const alexInvoice = merchant.invoices.find((i) => i.invoiceNumber === 'INV-1024');

    res.json({
      seeded: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
      },
      counts: {
        customers: merchant.customers.length,
        invoices: merchant.invoices.length,
        transactions: merchant.transactions.length,
        reminders: merchant.reminders.length,
        actionRequests: merchant.actionRequests.length,
      },
      demoHighlight: {
        alexCustomerId: alexCust?.id,
        alexCustomerName: alexCust?.name,
        alexInvoiceNumber: alexInvoice?.invoiceNumber,
        alexInvoiceStatus: alexInvoice?.status,
        alexInvoiceAmount: alexInvoice?.amount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
