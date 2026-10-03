# Payment Reminder & Dunning Agent

## 1. Merchant Reminder Policies

Merchants configure automated dunning rules via `ReminderPolicy`:
- **First Reminder**: 1 day overdue (Friendly tone)
- **Second Reminder**: 3 days overdue (Direct follow-up)
- **Final Reminder**: 7 days overdue (Escalation notice)
- **Max Reminders**: Maximum allowed notifications before forcing human review (default: 3)
- **Minimum Interval**: Minimum days between reminders (default: 2 days)
- **Stop on Payment**: **YES** (Enforces automated cancellation of pending reminders)
- **Require Approval**: **YES** (Routes reminders to Action Center for human sign-off)

---

## 2. Personalized Generation Without Hallucination

All reminder templates populate strictly from verified database records:
- Customer name
- Merchant trading name
- Exact invoice number and dollar amount
- Direct, secure PayPal invoice payment link

AI never fabricates invoice IDs, dollar amounts, or fake payment terms.

---

## 3. Instant Feedback & Cancellation Loop

When a customer pays:
1. PayPal delivers `PAYMENT.CAPTURE.COMPLETED` or `INVOICING.INVOICE.PAID` webhook.
2. PayPilot queries all reminders with status `SCHEDULED` or `NEEDS_REVIEW` linked to that invoice.
3. Automatically transitions their status to `CANCELLED`.
4. Records `CANCELLED` event in `ReminderEvent` log.
