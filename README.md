# PayPilot
### AI Revenue Recovery & Customer Intelligence Agent for PayPal
*Built for the **PayPal AI Hackathon 2026***

---

## 1. Executive Summary

**PayPilot** is an intelligent revenue operations platform that transforms passive PayPal transaction data into predictive customer intelligence, detects at-risk revenue, prepares personalized recovery actions, and executes authorized PayPal workflows through a strict Permission Engine.

Traditional payment dashboards only show historical totals. PayPilot closes the loop:

```text
PAYPAL TRANSACTION DATA
          ↓
CUSTOMER INTELLIGENCE ENGINE (Behavioral baseline vs 30D activity)
          ↓
REVENUE INTELLIGENCE (Risk detection & root cause calculations)
          ↓
AI REVENUE RECOVERY AGENT (Strategy formulation)
          ↓
PERMISSION ENGINE (Strict 4-Tier Security: READ, COMMUNICATION, LOW_RISK, FINANCIAL)
          ↓
ACTION CENTER (Human-in-the-loop review & approval)
          ↓
PAYPAL WORKFLOW (Invoice reminder / Payment recovery link)
          ↓
CUSTOMER ACTION & SETTLEMENT
          ↓
PAYPAL WEBHOOK (Signature-verified event)
          ↓
FEEDBACK LOOP (Auto-cancel scheduled reminders & update metrics)
```

---

## 2. Core Innovations

1. **Deterministic Calculations, Generative Explanations**: Financial metrics, aging brackets, and risk scores are computed deterministically in backend code. The AI explains verified numbers rather than hallucinating financial amounts.
2. **"What Changed?" Customer Behavior Engine**: Automatically compares a customer's historical payment discipline (e.g. 90-day baseline) against recent 30-day activity, pinpointing payment delay shifts (+4.8 days) and failed transactions.
3. **4-Tier Permission Gatekeeper**: Strict boundaries ensure AI models can analyze data (`READ`) and propose communications (`COMMUNICATION`), but **can never autonomously execute financial movements (`FINANCIAL`)** without explicit human authorization.
4. **PayPal Event-Driven Feedback Loop**: When a customer settles an invoice via PayPal, webhook events instantly mark the invoice paid, auto-cancel scheduled reminders, update risk profiles, and write to the immutable audit log.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, AG Grid Community, Recharts, Lucide Icons
- **Backend API**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite (Zero-config out of the box) / PostgreSQL support
- **PayPal SDK / REST**: PayPal Developer Platform (v1/v2 REST APIs, Orders, Invoicing, Subscriptions, Payments, Webhooks)
- **Testing**: Vitest, Supertest (100% test pass rate across critical safety paths)

---

## 4. Quick Start & Setup

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Paypal
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=5000
NODE_ENV=development
JWT_SECRET="paypilot_super_secure_jwt_secret_change_in_production_2026"
PAYPAL_CLIENT_ID="<YOUR_SANDBOX_CLIENT_ID>"
PAYPAL_CLIENT_SECRET="<YOUR_SANDBOX_CLIENT_SECRET>"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
PAYPAL_WEBHOOK_ID="<YOUR_WEBHOOK_ID>"
```

### 3. Initialize Database & Seed Demo Data
```bash
# Push Prisma schema to SQLite
npm run prisma:push --workspace=server

# Seed Demo Business "Nova Digital Studio" (30+ customers, 100+ transactions)
npm run seed
```

### 4. Run the Full-Stack Application
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:5000`

---

## 5. 3-Minute Hackathon Demo Flow

Use the built-in **Interactive 3-Min Hackathon Demo Stepper** in the top navigation bar:

1. **Executive Dashboard (`/dashboard`)**: Inspect processed volume ($48,240), outstanding exposure ($7,820), and revenue at risk ($4,210) for *Nova Digital Studio*.
2. **AI Revenue Intelligence (`/ai-agent`)**: Ask *"Why is my revenue at risk?"* — The AI queries live database tools and attributes risk to failed payments and overdue accounts.
3. **Customer Intelligence (`/customer-intelligence`)**: Explore deterministic segments (Reliable, Reminder-Responsive, At-Risk, High-Value, Overdue, Declining).
4. **Customer 360 Profile (`/customers/:id`)**: Open *Alex Technologies* and inspect payment history and delay trajectory.
5. **"What Changed?" Engine**: Click *"What Changed?"* to observe AI comparing historical 1.4-day payment speed against recent 6.2-day delay and 2 payment failures.
6. **Formulate Recovery Actions**: Ask AI *"Prepare recovery actions for customers overdue by more than 3 days"*.
7. **Action Center (`/action-center`)**: Review the AI-prepared reminder for *Alex Technologies (INV-1024)* and click **Approve & Authorize**.
8. **PayPal Webhook Ingestion (`/demo-simulator`)**: Click **Simulate $450 Payment** (or dispatch real PayPal webhook).
9. **Automated Feedback Loop**: Observe invoice `#INV-1024` marked **PAID** and future scheduled reminders **AUTOMATICALLY CANCELLED**.
10. **Executive Loop Completed**: Return to dashboard to see outstanding balance drop, recovered revenue rise, and risk scores improve.

---

## 6. Running Automated Tests

```bash
npm test --workspace=server
```

Runs the 9 critical integration tests:
- **Permission Engine Safety Block**: AI direct attempts at `FINANCIAL` tier actions are blocked and routed to human approval.
- **Customer Intelligence Metrics**: Deterministic delay, failure count, and risk score calculation.
- **Behavior Change Detection**: Accurate delta calculation for the "What Changed?" feature.
- **Revenue Intelligence**: Verified mathematical calculations.
- **AI Tool Calling**: Real backend tool execution without hallucinatory output.
- **Webhook Feedback Loop**: Confirmation of payment settlement and automatic reminder cancellation.

---

## 7. Documentation Index

- [Architecture & Data Flow](docs/architecture.md)
- [Security & 4-Tier Permission Model](docs/security.md)
- [PayPal Integration & Webhooks](docs/paypal-integration.md)
- [AI Agent & Tool Calling](docs/ai-agent.md)
- [Customer Intelligence Engine](docs/customer-intelligence.md)
- [Reminder System & Dunning Policies](docs/reminder-system.md)

---

## 8. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
