# PayPilot Security & Governance Architecture

## 1. Safety Core Philosophy

PayPilot operates on a non-negotiable security principle:
> **The AI Agent is an advisory employee, NOT an autonomous financial mover. Direct financial movements and unapproved customer communications are blocked at the code level by the Permission Engine.**

---

## 2. The 4-Tier Permission Model

Every tool and action in PayPilot is assigned a strict tier:

| Tier | Actions | Autonomy Rules |
|---|---|---|
| **READ** | `get_transactions`, `get_customers`, `get_customer_profile`, `calculate_revenue_metrics`, `analyze_customer` | AI permitted to execute autonomously to perform analytics and reasoning. |
| **COMMUNICATION** | `prepare_reminder`, `generate_reminder_content`, `send_reminder` | Governed by merchant's `ReminderPolicy.requireApproval`. Staged in Action Center if approval enabled. |
| **LOW_RISK** | `schedule_reminder`, `cancel_reminder`, `create_invoice` | Subject to policy constraints and audit logging. |
| **FINANCIAL** | `capture_payment`, `refund_payment`, `charge_card`, `suspend_subscription` | **NEVER** executable autonomously by AI. Blocked and escalated to human merchant with cryptographic audit record. |

---

## 3. Webhook Cryptographic Verification

PayPal Webhooks received at `POST /api/webhooks/paypal` undergo verification via the PayPal API endpoint:
`POST /v1/notifications/verify-webhook-signature`

Headers validated:
- `PAYPAL-AUTH-ALGO`
- `PAYPAL-CERT-URL`
- `PAYPAL-TRANSMISSION-ID`
- `PAYPAL-TRANSMISSION-SIG`
- `PAYPAL-TRANSMISSION-TIME`

### Idempotency Protection
Every incoming webhook event ID is checked against the database `WebhookEvent` table to guarantee duplicate transmissions are never processed more than once.

---

## 4. Credential Isolation & Environment Hygiene

- All PayPal Client IDs, Secrets, and Webhook IDs are kept strictly in backend environment variables (`.env`).
- Frontend never receives secret keys.
- Production builds omit all test mock tokens and enforce HTTPS transport.
