import { prisma } from '../../prisma/client';
import bcrypt from 'bcryptjs';
import { calculateCustomerMetrics } from '../customerIntelligence/metricsCalculator';
import { calculateMerchantRevenue } from '../revenueIntelligence/revenueCalculator';

export async function seedDemoBusiness(): Promise<{ merchantId: string; userEmail: string }> {
  // Clear existing demo data
  await prisma.auditLog.deleteMany({});
  await prisma.actionRequest.deleteMany({});
  await prisma.reminderEvent.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.reminderPolicy.deleteMany({});
  await prisma.aiInsight.deleteMany({});
  await prisma.aiRecommendation.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.payPalAccount.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.merchant.deleteMany({});

  const passwordHash = await bcrypt.hash('DemoPass2026!', 10);

  // 1. Create Demo Merchant: Nova Digital Studio
  const merchant = await prisma.merchant.create({
    data: {
      name: 'Nova Digital Studio',
      businessType: 'DIGITAL_AGENCY_SAAS',
      currency: 'USD',
    },
  });

  // 2. Create Merchant Admin User
  await prisma.user.create({
    data: {
      email: 'admin@novadigital.test',
      name: 'Sarah Chen (Lead Operations)',
      passwordHash,
      role: 'MERCHANT_ADMIN',
      merchantId: merchant.id,
    },
  });

  // 3. Create PayPal Sandbox Account
  await prisma.payPalAccount.create({
    data: {
      merchantId: merchant.id,
      email: 'billing-sandbox@novadigital.test',
      payerId: 'PAYER-NOVA-SANDBOX-101',
      sandboxMode: true,
      accountStatus: 'ACTIVE',
      lastSyncAt: new Date(),
    },
  });

  // 4. Create Merchant Reminder Policy
  await prisma.reminderPolicy.create({
    data: {
      merchantId: merchant.id,
      name: 'Standard SaaS Recovery Policy',
      firstReminderDays: 1,
      secondReminderDays: 3,
      finalReminderDays: 7,
      maxReminders: 3,
      minIntervalDays: 2,
      stopOnPayment: true,
      requireApproval: true,
      isDefault: true,
    },
  });

  const now = Date.now();
  const oneDay = 86400000;

  // 5. Create 32 realistic customers with diverse behavioral profiles
  const rawCustomers = [
    // 1. Killer Demo Customer: Alex Technologies (Deteriorating)
    {
      name: 'Alex Technologies',
      email: 'alex@alextech.io',
      company: 'Alex Technologies Inc.',
      firstSeenDays: 180,
      segment: 'AT_RISK',
      notes: 'Key SaaS integration client. Historically disciplined payer, recent payment friction.',
    },
    // 2. High Value Enterprise: CyberPeak Solutions
    {
      name: 'CyberPeak Solutions',
      email: 'billing@cyberpeak.net',
      company: 'CyberPeak Global',
      firstSeenDays: 320,
      segment: 'HIGH_VALUE',
      notes: 'Enterprise retainer customer. High volume.',
    },
    // 3. Reminder Responsive: BrightPath Media
    {
      name: 'BrightPath Media',
      email: 'finance@brightpathmedia.com',
      company: 'BrightPath Creative',
      firstSeenDays: 140,
      segment: 'REMINDER_RESPONSIVE',
      notes: 'Always settles within 24h of receiving friendly PayPal reminder.',
    },
    // 4. Overdue Account: Luminary Design Co.
    {
      name: 'Luminary Design Co.',
      email: 'accounts@luminarydesign.co',
      company: 'Luminary Studio',
      firstSeenDays: 90,
      segment: 'OVERDUE',
      notes: 'Invoice overdue 5 days.',
    },
    // 5. Severe Delinquent / Merchant Review: Apex BioLabs
    {
      name: 'Apex BioLabs',
      email: 'treasury@apexbio.org',
      company: 'Apex BioLabs LLC',
      firstSeenDays: 240,
      segment: 'AT_RISK',
      notes: 'Large overdue invoice of $4,000, 14 days overdue with 2 payment declines.',
    },
    // 6-32: Diverse Active / Reliable / New / Inactive Accounts
    { name: 'Vortex Dynamics', email: 'billing@vortexdynamics.com', company: 'Vortex Dynamics', firstSeenDays: 210, segment: 'RELIABLE' },
    { name: 'Echo Cloud Systems', email: 'pay@echocloud.io', company: 'Echo Cloud Systems', firstSeenDays: 190, segment: 'RELIABLE' },
    { name: 'Solstice Creative Lab', email: 'finance@solsticelab.co', company: 'Solstice Lab', firstSeenDays: 80, segment: 'REMINDER_RESPONSIVE' },
    { name: 'Zenith Logistics', email: 'ap@zenithlogistics.com', company: 'Zenith Global', firstSeenDays: 300, segment: 'HIGH_VALUE' },
    { name: 'Prism Media Works', email: 'prism@prismmedia.tv', company: 'Prism Media', firstSeenDays: 120, segment: 'RELIABLE' },
    { name: 'Kinetics AI Labs', email: 'contact@kineticsai.dev', company: 'Kinetics AI', firstSeenDays: 60, segment: 'RELIABLE' },
    { name: 'Stratosphere Group', email: 'admin@stratospheregroup.net', company: 'Stratosphere Group', firstSeenDays: 250, segment: 'HIGH_VALUE' },
    { name: 'Nimbus Web Services', email: 'billing@nimbusweb.org', company: 'Nimbus Services', firstSeenDays: 15, segment: 'NEW' },
    { name: 'Beacon Software Co.', email: 'accounts@beaconsoft.io', company: 'Beacon Software', firstSeenDays: 150, segment: 'RELIABLE' },
    { name: 'Hyperion Analytics', email: 'invoices@hyperionanalytics.com', company: 'Hyperion Analytics', firstSeenDays: 175, segment: 'RELIABLE' },
    { name: 'Catalyst Ventures', email: 'finance@catalystvc.fund', company: 'Catalyst Ventures', firstSeenDays: 220, segment: 'RELIABLE' },
    { name: 'Aether Marketing', email: 'pay@aethermktg.com', company: 'Aether Marketing', firstSeenDays: 110, segment: 'REMINDER_RESPONSIVE' },
    { name: 'Quantum Leap Tech', email: 'billing@quantumleap.tech', company: 'Quantum Leap Tech', firstSeenDays: 130, segment: 'RELIABLE' },
    { name: 'Orion Data Corp', email: 'accounts@oriondata.io', company: 'Orion Data Corp', firstSeenDays: 280, segment: 'HIGH_VALUE' },
    { name: 'Horizon Gaming Studios', email: 'ap@horizongaming.com', company: 'Horizon Studios', firstSeenDays: 95, segment: 'RELIABLE' },
    { name: 'Cascade Capital Advisors', email: 'finance@cascadeadvisors.com', company: 'Cascade Capital', firstSeenDays: 310, segment: 'RELIABLE' },
    { name: 'Pinnacle Health Tech', email: 'billing@pinnaclehealth.io', company: 'Pinnacle Health Tech', firstSeenDays: 140, segment: 'RELIABLE' },
    { name: 'Starlight Media Network', email: 'accounts@starlightmedia.net', company: 'Starlight Media', firstSeenDays: 160, segment: 'DECLINING' },
    { name: 'TrueNorth Logistics', email: 'finance@truenorth.delivery', company: 'TrueNorth Logistics', firstSeenDays: 45, segment: 'RELIABLE' },
    { name: 'Apex Mountain Gear', email: 'orders@apexmountaingear.com', company: 'Apex Mountain Gear', firstSeenDays: 70, segment: 'RELIABLE' },
    { name: 'Synergy Retail Group', email: 'ap@synergyretail.com', company: 'Synergy Retail Group', firstSeenDays: 20, segment: 'NEW' },
    { name: 'Ironclad Security Systems', email: 'billing@ironcladsec.com', company: 'Ironclad Security', firstSeenDays: 190, segment: 'RELIABLE' },
    { name: 'BlueWave Interactive', email: 'finance@bluewave.digital', company: 'BlueWave Digital', firstSeenDays: 85, segment: 'REMINDER_RESPONSIVE' },
    { name: 'NovaSpark Labs', email: 'pay@novasparklabs.org', company: 'NovaSpark Labs', firstSeenDays: 160, segment: 'INACTIVE' },
    { name: 'Evergreen Consulting', email: 'accounts@evergreenconsult.com', company: 'Evergreen Consulting', firstSeenDays: 125, segment: 'RELIABLE' },
    { name: 'Helix Interactive', email: 'invoices@helixinteractive.com', company: 'Helix Interactive', firstSeenDays: 215, segment: 'RELIABLE' },
    { name: 'Solarium Energy SaaS', email: 'billing@solariumsaas.io', company: 'Solarium Energy', firstSeenDays: 105, segment: 'RELIABLE' },
  ];

  const createdCustomers: any[] = [];
  for (const raw of rawCustomers) {
    const cust = await prisma.customer.create({
      data: {
        merchantId: merchant.id,
        name: raw.name,
        email: raw.email,
        company: raw.company,
        segment: raw.segment,
        notes: raw.notes || null,
        firstSeenAt: new Date(now - raw.firstSeenDays * oneDay),
        lastSeenAt: new Date(now - Math.floor(Math.random() * 5) * oneDay),
      },
    });
    createdCustomers.push(cust);
  }

  // 6. Generate Transactions, Invoices, Subscriptions & Reminders
  const alexCust = createdCustomers[0]; // Alex Technologies
  const cyberPeak = createdCustomers[1]; // CyberPeak Solutions
  const brightPath = createdCustomers[2]; // BrightPath Media
  const luminary = createdCustomers[3]; // Luminary Design
  const apexBio = createdCustomers[4]; // Apex BioLabs

  // Alex Technologies:
  // Historical: 3 completed payments in prior 90 days ($700 each = $2,100)
  // Recent: 1 completed payment ($620), 2 recent failed payments ($450 each), 1 overdue invoice #INV-1024 ($450, 4 days overdue)
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalTransactionId: 'TXN-ALEX-HIST-1',
      amount: 700,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 75 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalTransactionId: 'TXN-ALEX-HIST-2',
      amount: 700,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 45 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalTransactionId: 'TXN-ALEX-HIST-3',
      amount: 700,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 35 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalTransactionId: 'TXN-ALEX-RECENT-1',
      amount: 620,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 15 * oneDay),
    },
  });
  // 2 failed payments for Alex
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalTransactionId: 'TXN-ALEX-FAIL-1',
      amount: 450,
      status: 'FAILED',
      failureReason: 'PAYMENT_METHOD_DECLINED_INSUFFICIENT_FUNDS',
      riskIndicator: 'HIGH',
      transactionDate: new Date(now - 5 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalTransactionId: 'TXN-ALEX-FAIL-2',
      amount: 450,
      status: 'FAILED',
      failureReason: 'PAYMENT_SOURCE_CANNOT_BE_CHARGED',
      riskIndicator: 'HIGH',
      transactionDate: new Date(now - 2 * oneDay),
    },
  });

  // Alex Invoices:
  // Settled historical invoice
  await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      invoiceNumber: 'INV-1002',
      paypalInvoiceId: 'INV2-ALEX-1002',
      amount: 700,
      status: 'PAID',
      issueDate: new Date(now - 48 * oneDay),
      dueDate: new Date(now - 46 * oneDay),
      paidDate: new Date(now - 45 * oneDay), // paid in 1 day!
    },
  });
  // Active overdue invoice: INV-1024
  const alexOverdueInv = await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      invoiceNumber: 'INV-1024',
      paypalInvoiceId: 'INV2-ALEX-1024',
      amount: 450,
      status: 'OVERDUE',
      issueDate: new Date(now - 14 * oneDay),
      dueDate: new Date(now - 4 * oneDay), // 4 days overdue
      paymentLink: 'https://www.sandbox.paypal.com/invoice/p/#INV2-ALEX-1024',
    },
  });

  // CyberPeak (High value enterprise, $12,000 lifetime, $1,500 overdue)
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: cyberPeak.id,
      paypalTransactionId: 'TXN-CYBER-1',
      amount: 5500,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 60 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: cyberPeak.id,
      paypalTransactionId: 'TXN-CYBER-2',
      amount: 5500,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 25 * oneDay),
    },
  });
  await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: cyberPeak.id,
      invoiceNumber: 'INV-1019',
      paypalInvoiceId: 'INV2-CYBER-1019',
      amount: 1500,
      status: 'OVERDUE',
      issueDate: new Date(now - 12 * oneDay),
      dueDate: new Date(now - 2 * oneDay),
      paymentLink: 'https://www.sandbox.paypal.com/invoice/p/#INV2-CYBER-1019',
    },
  });

  // BrightPath Media (Reminder responsive, $350 overdue, 2 prior settled after reminders)
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: brightPath.id,
      paypalTransactionId: 'TXN-BRIGHT-1',
      amount: 1200,
      status: 'COMPLETED',
      paymentMethod: 'PAYPAL_BALANCE',
      riskIndicator: 'LOW',
      transactionDate: new Date(now - 40 * oneDay),
    },
  });
  const brightInvPaid = await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: brightPath.id,
      invoiceNumber: 'INV-1008',
      amount: 1200,
      status: 'PAID',
      issueDate: new Date(now - 45 * oneDay),
      dueDate: new Date(now - 42 * oneDay),
      paidDate: new Date(now - 40 * oneDay),
    },
  });
  // Past reminder converted for BrightPath
  const pastRem = await prisma.reminder.create({
    data: {
      merchantId: merchant.id,
      customerId: brightPath.id,
      invoiceId: brightInvPaid.id,
      reminderNumber: 1,
      channel: 'EMAIL',
      status: 'PAID',
      scheduledFor: new Date(now - 41 * oneDay),
      sentAt: new Date(now - 41 * oneDay),
      messageContent: 'Friendly reminder regarding invoice #INV-1008',
      responseTimeMinutes: 1440, // 24 hours
    },
  });
  await prisma.reminderEvent.create({
    data: {
      reminderId: pastRem.id,
      eventType: 'PAID',
      metadataJson: JSON.stringify({ conversionTimeHours: 24 }),
    },
  });
  // Current overdue invoice for BrightPath
  await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: brightPath.id,
      invoiceNumber: 'INV-1025',
      paypalInvoiceId: 'INV2-BRIGHT-1025',
      amount: 350,
      status: 'OVERDUE',
      issueDate: new Date(now - 10 * oneDay),
      dueDate: new Date(now - 3 * oneDay),
    },
  });

  // Luminary Design ($870 overdue 5 days)
  await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: luminary.id,
      invoiceNumber: 'INV-1021',
      paypalInvoiceId: 'INV2-LUM-1021',
      amount: 870,
      status: 'OVERDUE',
      issueDate: new Date(now - 15 * oneDay),
      dueDate: new Date(now - 5 * oneDay),
    },
  });

  // Apex BioLabs ($4,000 overdue, 14 days overdue, multiple failures)
  await prisma.invoice.create({
    data: {
      merchantId: merchant.id,
      customerId: apexBio.id,
      invoiceNumber: 'INV-1011',
      paypalInvoiceId: 'INV2-APEX-1011',
      amount: 4000,
      status: 'OVERDUE',
      issueDate: new Date(now - 30 * oneDay),
      dueDate: new Date(now - 14 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: apexBio.id,
      paypalTransactionId: 'TXN-APEX-FAIL-1',
      amount: 4000,
      status: 'FAILED',
      failureReason: 'CARD_LIMIT_EXCEEDED',
      riskIndicator: 'HIGH',
      transactionDate: new Date(now - 13 * oneDay),
    },
  });
  await prisma.transaction.create({
    data: {
      merchantId: merchant.id,
      customerId: apexBio.id,
      paypalTransactionId: 'TXN-APEX-FAIL-2',
      amount: 4000,
      status: 'FAILED',
      failureReason: 'PAYMENT_CAPTURE_DENIED',
      riskIndicator: 'HIGH',
      transactionDate: new Date(now - 10 * oneDay),
    },
  });

  // Subscriptions
  await prisma.subscription.create({
    data: {
      merchantId: merchant.id,
      customerId: alexCust.id,
      paypalSubscriptionId: 'I-SUB-ALEX-01',
      planName: 'PayPilot Enterprise Growth Tier',
      status: 'ACTIVE',
      amount: 299,
      billingCycle: 'MONTHLY',
      nextBillingDate: new Date(now + 16 * oneDay),
    },
  });
  await prisma.subscription.create({
    data: {
      merchantId: merchant.id,
      customerId: cyberPeak.id,
      paypalSubscriptionId: 'I-SUB-CYBER-01',
      planName: 'Enterprise SLA Support',
      status: 'ACTIVE',
      amount: 850,
      billingCycle: 'MONTHLY',
      nextBillingDate: new Date(now + 10 * oneDay),
    },
  });
  await prisma.subscription.create({
    data: {
      merchantId: merchant.id,
      customerId: apexBio.id,
      paypalSubscriptionId: 'I-SUB-APEX-01',
      planName: 'Dedicated Cloud Environment',
      status: 'PAST_DUE',
      amount: 650,
      billingCycle: 'MONTHLY',
      failedAttempts: 2,
      riskIndicator: 'HIGH',
      nextBillingDate: new Date(now - 3 * oneDay),
    },
  });

  // Populate remaining 100+ transactions across other customers to hit ~ $48,240 Total Revenue
  for (let i = 5; i < createdCustomers.length; i++) {
    const c = createdCustomers[i];
    const txnCount = 2 + Math.floor(Math.random() * 4);
    for (let j = 0; j < txnCount; j++) {
      const daysBack = 5 + Math.floor(Math.random() * 160);
      const amt = Math.round(150 + Math.random() * 850);
      await prisma.transaction.create({
        data: {
          merchantId: merchant.id,
          customerId: c.id,
          paypalTransactionId: `TXN-${c.name.substring(0, 3).toUpperCase()}-${i}-${j}`,
          amount: amt,
          status: 'COMPLETED',
          paymentMethod: 'PAYPAL_BALANCE',
          riskIndicator: 'LOW',
          transactionDate: new Date(now - daysBack * oneDay),
        },
      });
    }

    // Add 1 invoice per customer
    const invAmount = Math.round(200 + Math.random() * 600);
    const isPaid = Math.random() > 0.3;
    const invDueDays = isPaid ? Math.floor(Math.random() * 80) : -Math.floor(Math.random() * 6);

    await prisma.invoice.create({
      data: {
        merchantId: merchant.id,
        customerId: c.id,
        invoiceNumber: `INV-10${30 + i}`,
        paypalInvoiceId: `INV2-10${30 + i}`,
        amount: invAmount,
        status: isPaid ? 'PAID' : invDueDays < 0 ? 'OVERDUE' : 'UNPAID',
        issueDate: new Date(now - 30 * oneDay),
        dueDate: new Date(now - invDueDays * oneDay),
        paidDate: isPaid ? new Date(now - (invDueDays - 1) * oneDay) : null,
      },
    });
  }

  // Pre-calculate metrics for all customers
  for (const c of createdCustomers) {
    await calculateCustomerMetrics(c.id);
  }
  await calculateMerchantRevenue(merchant.id);

  console.log('✅ Demo Business "Nova Digital Studio" seeded successfully!');
  return { merchantId: merchant.id, userEmail: 'admin@novadigital.test' };
}
