# PayPal Integration Architecture

PayPilot interfaces directly with the official **PayPal Developer Platform (v1/v2 REST APIs)** in the PayPal Sandbox environment.

## 1. Centralized PayPal Client Module

All PayPal network calls are encapsulated within `server/src/services/paypal/`:

- `paypalAuth.ts`: Handles token acquisition (`/v1/oauth2/token`) with in-memory caching and automatic refresh before expiration.
- `paypalClient.ts`: Central Axios instance with request interceptor attaching active Bearer token.
- `paypalOrders.ts`: Handles Order creation (`/v2/checkout/orders`) and capture (`/v2/checkout/orders/{id}/capture`).
- `paypalInvoices.ts`: Creates draft invoices (`/v2/invoicing/invoices`), dispatches invoices (`/send`), sends payment reminders (`/remind`), and cancels invoices (`/cancel`).
- `paypalPayments.ts`: Retrieves capture details and issues refunds (`/v2/payments/captures/{id}/refund`).
- `paypalSubscriptions.ts`: Manages recurring billing agreements (`/v1/billing/subscriptions`).
- `paypalTransactions.ts`: Retrieves merchant reporting transactions (`/v1/reporting/transactions`).
- `paypalWebhooks.ts`: Signature verification and event ingestion.

---

## 2. PayPal Sandbox Configuration

In `.env`:

```env
PAYPAL_CLIENT_ID="<YOUR_SANDBOX_CLIENT_ID>"
PAYPAL_CLIENT_SECRET="<YOUR_SANDBOX_CLIENT_SECRET>"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
PAYPAL_WEBHOOK_ID="<YOUR_WEBHOOK_ID>"
```

---

## 3. Webhook Feedback Loop Workflow

When a customer pays an invoice via PayPal:

```text
Customer Completes Payment on PayPal
          ↓
PayPal Dispatches Webhook (e.g. PAYMENT.CAPTURE.COMPLETED)
          ↓
PayPilot POST /api/webhooks/paypal
          ↓
1. Verify Webhook Signature
2. Check Idempotency (prevent double processing)
3. Locate Target Invoice & Customer
4. Update Invoice status -> PAID
5. Cancel all future scheduled reminders for this invoice
6. Re-calculate Customer Intelligence metrics & risk score
7. Update Executive Revenue metrics
8. Write immutable Audit Log record
```
