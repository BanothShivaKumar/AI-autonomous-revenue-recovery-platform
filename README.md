# 🚀 PayPilot
## AI Revenue Recovery & Customer Intelligence Agent for PayPal

> **Built for the PayPal AI Hackathon 2026**

**PayPilot** is an AI-powered Revenue Operations platform that transforms raw PayPal transaction data into actionable customer intelligence, revenue-risk insights, and controlled recovery workflows.

Instead of simply telling businesses **what happened**, PayPilot helps answer:

- 💰 **Where is revenue at risk?**
- 🔍 **Why is it at risk?**
- 👤 **Which customers require attention?**
- 🤖 **What recovery action should be taken?**
- 🔐 **What is the AI actually allowed to do?**
- ⚡ **What happens after the customer pays?**

PayPilot closes the loop from **transaction → intelligence → action → payment → automated feedback**.

---

## 🧠 The PayPilot Loop

```text
┌──────────────────────────────┐
│      PAYPAL TRANSACTIONS     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│   CUSTOMER INTELLIGENCE      │
│  Historical vs Recent Activity│
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│    REVENUE INTELLIGENCE      │
│ Risk Detection + Root Cause  │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│   AI REVENUE RECOVERY AGENT  │
│ Strategy + Action Generation │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│     PERMISSION ENGINE        │
│ READ → COMMUNICATION →       │
│ LOW_RISK → FINANCIAL         │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       ACTION CENTER          │
│ Human Review & Authorization │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│      PAYPAL WORKFLOW         │
│ Invoice / Reminder / Payment │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       CUSTOMER PAYS          │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│   PAYPAL WEBHOOK EVENT       │
│ Signature-Verified Event     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│      FEEDBACK LOOP           │
│ Update Risk + Cancel Dunning │
│ + Update Revenue Metrics     │
└──────────────────────────────┘
```

---

# 🎯 Why PayPilot?

Traditional payment dashboards are primarily **descriptive**.

They show:

> "You have $7,820 outstanding."

PayPilot goes further:

> **"$4,210 of your outstanding revenue is currently at risk because payment failures and increased payment delays are concentrated among a specific group of customers."**

Then it turns that insight into a controlled action:

> **"Prepare a personalized recovery reminder for the affected customers."**

And after the customer pays:

> **"Payment confirmed → invoice settled → future reminders cancelled → risk profile updated."**

This creates an intelligent, event-driven revenue recovery loop.

---

# ⭐ Core Innovations

## 1. Deterministic Financial Intelligence

Financial calculations are **never delegated to the LLM**.

Metrics such as:

- Outstanding balance
- Revenue at risk
- Payment delays
- Failed payment counts
- Invoice aging
- Recovery amounts
- Risk scores

are calculated deterministically by backend services.

The AI receives verified results and focuses on **reasoning, explanation, prioritization, and action formulation**.

```text
Raw Data
   ↓
Deterministic Backend Calculations
   ↓
Verified Financial Metrics
   ↓
AI Explanation & Strategy
```

This significantly reduces the risk of AI-generated financial hallucinations.

---

# 2. 🔎 "What Changed?" Customer Intelligence

PayPilot doesn't only analyze the current state.

It compares a customer's historical behavior against their recent activity.

### Example

```text
Historical Payment Speed
        ↓
      1.4 days
        ↓
Recent Payment Delay
        ↓
      6.2 days
        ↓
Change: +4.8 days
```

The system can also identify:

- New payment failures
- Increasing invoice aging
- Declining payment discipline
- Reduced transaction activity
- Repeated overdue behavior

This allows businesses to identify **behavioral deterioration before it becomes a larger revenue problem**.

---

# 3. 🔐 4-Tier AI Permission Engine

AI agents should not automatically control financial operations.

PayPilot therefore introduces a strict permission model:

| Permission Tier | Example | AI Access |
|---|---|---|
| `READ` | View customer/payment data | ✅ |
| `COMMUNICATION` | Prepare customer messages | ✅ |
| `LOW_RISK` | Create non-financial operational actions | Controlled |
| `FINANCIAL` | Execute financial movement | 🚫 Human authorization |

The critical principle is:

> **AI can recommend financial actions, but it cannot independently execute financial movement.**

Financial actions are routed through the **Action Center**, where a human must explicitly authorize the operation.

```text
AI Recommendation
       ↓
Permission Engine
       ↓
FINANCIAL ACTION?
       ↓
   HUMAN REVIEW
       ↓
Approve & Authorize
       ↓
PayPal Workflow
```

---

# 4. ⚡ Event-Driven PayPal Feedback Loop

PayPilot is not a one-way automation system.

When a customer completes a payment through PayPal, the platform can process the corresponding webhook event.

```text
Customer Payment
       ↓
PayPal Webhook
       ↓
Signature Verification
       ↓
Invoice → PAID
       ↓
Cancel Future Reminders
       ↓
Update Customer Risk
       ↓
Update Revenue Metrics
       ↓
Audit Log
```

This allows the system to continuously learn from the latest payment state.

---

# 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │   PayPal APIs    │
                    └────────┬─────────┘
                             │
                             ↓
┌────────────────────────────────────────────────┐
│                  PayPilot                      │
│                                                │
│  ┌──────────────┐       ┌──────────────────┐  │
│  │ React Frontend│ ───→ │ Express API      │  │
│  └──────────────┘       └────────┬─────────┘  │
│                                  │             │
│              ┌───────────────────┼──────────┐  │
│              ↓                   ↓          ↓  │
│      ┌──────────────┐   ┌──────────────┐  │  │
│      │ Customer     │   │ Revenue      │  │  │
│      │ Intelligence │   │ Intelligence │  │  │
│      └──────────────┘   └──────────────┘  │  │
│              │                   │          │  │
│              └─────────┬─────────┘          │  │
│                        ↓                    │  │
│               ┌─────────────────┐          │  │
│               │ AI Agent        │          │  │
│               │ Tool Calling    │          │  │
│               └────────┬────────┘          │  │
│                        ↓                    │  │
│               ┌─────────────────┐          │  │
│               │ Permission      │          │  │
│               │ Engine          │          │  │
│               └────────┬────────┘          │  │
│                        ↓                    │  │
│               ┌─────────────────┐          │  │
│               │ Action Center   │          │  │
│               └────────┬────────┘          │  │
│                        ↓                    │  │
│               ┌─────────────────┐          │  │
│               │ Prisma ORM      │          │  │
│               └────────┬────────┘          │  │
│                        ↓                    │  │
│               ┌─────────────────┐          │  │
│               │ SQLite /         │          │  │
│               │ PostgreSQL       │          │  │
│               └─────────────────┘          │  │
└────────────────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- AG Grid Community
- Recharts
- Lucide Icons

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- REST APIs
- JWT Authentication

### Database

- SQLite — zero-config development
- PostgreSQL — production-ready deployment

### PayPal Integration

- PayPal Developer Platform
- PayPal REST APIs
- Orders
- Invoicing
- Subscriptions
- Payments
- Webhooks

### Testing

- Vitest
- Supertest
- Integration testing
- Permission-engine safety tests
- Webhook verification tests

---

# 🚀 Quick Start

## Prerequisites

Make sure you have:

- Node.js `18+`
- npm `9+`
- PayPal Developer Sandbox credentials

The application has been tested with Node.js `22`.

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd Paypal
npm install
```

---

## 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment:

```env
DATABASE_URL="file:./dev.db"

PORT=5000
NODE_ENV=development

JWT_SECRET="change_this_secret_in_production"

PAYPAL_CLIENT_ID="<YOUR_SANDBOX_CLIENT_ID>"
PAYPAL_CLIENT_SECRET="<YOUR_SANDBOX_CLIENT_SECRET>"

PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"

PAYPAL_WEBHOOK_ID="<YOUR_WEBHOOK_ID>"
```

> ⚠️ Never commit real PayPal credentials, JWT secrets, or production environment variables to GitHub.

---

# 🗄️ 3. Initialize the Database

Push the Prisma schema:

```bash
npm run prisma:push --workspace=server
```

Seed the demo environment:

```bash
npm run seed
```

The demo environment creates:

**Nova Digital Studio**

with:

- 30+ customers
- 100+ transactions
- invoices
- payment history
- behavioral metrics
- revenue-risk scenarios

---

# ▶️ 4. Start PayPilot

```bash
npm run dev
```

The application will be available at:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:5000
```

---

# 🎬 3-Minute Hackathon Demo

PayPilot includes an **Interactive 3-Minute Hackathon Demo Stepper** designed to demonstrate the complete intelligence-to-recovery loop.

## Step 1 — Executive Dashboard

Navigate to:

```text
/dashboard
```

Show:

- Processed Volume: **$48,240**
- Outstanding Exposure: **$7,820**
- Revenue at Risk: **$4,210**

Explain that the dashboard is not simply reporting historical payments — it is highlighting **potentially recoverable revenue**.

---

## Step 2 — Ask the AI

Navigate to:

```text
/ai-agent
```

Ask:

> **"Why is my revenue at risk?"**

The AI uses backend tools to retrieve verified information and explain the major contributors to revenue risk.

---

## Step 3 — Customer Intelligence

Navigate to:

```text
/customer-intelligence
```

Explore customer segments such as:

- Reliable
- Reminder-Responsive
- At-Risk
- High-Value
- Overdue
- Declining

These segments are derived from deterministic backend metrics.

---

## Step 4 — Customer 360

Open:

```text
/customers/:id
```

Select:

**Alex Technologies**

Inspect:

- Payment history
- Invoice history
- Payment delays
- Failed transactions
- Risk trajectory

---

## Step 5 — Demonstrate "What Changed?"

Click:

> **What Changed?**

The system compares historical and recent behavior.

### Example

```text
Historical payment speed: 1.4 days

Recent payment delay: 6.2 days

Behavior change: +4.8 days

Recent failures: 2
```

This demonstrates how PayPilot detects **behavioral deterioration**, rather than simply displaying an overdue invoice.

---

## Step 6 — Generate Recovery Actions

Ask the AI:

> **"Prepare recovery actions for customers overdue by more than 3 days."**

The AI analyzes the verified customer data and prepares appropriate recovery actions.

---

## Step 7 — Human Authorization

Navigate to:

```text
/action-center
```

Review the generated action for:

**Alex Technologies — INV-1024**

The action is presented for human review.

Click:

> **Approve & Authorize**

This demonstrates the Permission Engine and human-in-the-loop safety model.

---

# 💳 Step 8 — Simulate the Payment

Navigate to:

```text
/demo-simulator
```

Click:

> **Simulate $450 Payment**

Alternatively, dispatch a real PayPal sandbox webhook event.

---

# 🔄 Step 9 — Watch the Feedback Loop

PayPilot processes the payment event and automatically:

```text
INV-1024
   ↓
PAID
   ↓
Reminder Schedule Cancelled
   ↓
Customer Risk Updated
   ↓
Revenue Metrics Updated
   ↓
Audit Log Updated
```

Future scheduled reminders for the settled invoice are automatically cancelled.

---

# 📊 Step 10 — Close the Executive Loop

Return to:

```text
/dashboard
```

Observe the updated business state:

- Outstanding balance decreases
- Recovered revenue increases
- Customer risk improves
- Invoice status changes
- Scheduled reminders disappear

The complete loop is now demonstrated:

```text
DATA
 ↓
INTELLIGENCE
 ↓
RISK
 ↓
AI STRATEGY
 ↓
HUMAN AUTHORIZATION
 ↓
PAYPAL ACTION
 ↓
CUSTOMER PAYMENT
 ↓
WEBHOOK
 ↓
AUTOMATED FEEDBACK
```

---

# 🧪 Automated Testing

Run the backend test suite:

```bash
npm test --workspace=server
```

The test suite covers critical safety and intelligence paths, including:

### 🔐 Permission Engine

Verifies that AI attempts to directly execute `FINANCIAL` actions are blocked and routed through human authorization.

### 📈 Customer Intelligence

Validates:

- Payment delay calculations
- Failure counts
- Customer risk scores
- Behavioral metrics

### 🔎 Behavior Change Detection

Validates the `"What Changed?"` calculation and historical-vs-recent behavioral deltas.

### 💰 Revenue Intelligence

Tests deterministic revenue and exposure calculations.

### 🤖 AI Tool Calling

Ensures AI responses are grounded in actual backend tool execution rather than fabricated financial information.

### 🔔 Webhook Feedback Loop

Validates:

- Payment settlement
- Invoice status updates
- Reminder cancellation
- Risk updates

---

# 📚 Documentation

More detailed technical documentation is available in:

| Document | Description |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System architecture and data flow |
| [`docs/security.md`](docs/security.md) | 4-tier permission model and security |
| [`docs/paypal-integration.md`](docs/paypal-integration.md) | PayPal APIs and webhook integration |
| [`docs/ai-agent.md`](docs/ai-agent.md) | AI agent and tool-calling architecture |
| [`docs/customer-intelligence.md`](docs/customer-intelligence.md) | Customer intelligence engine |
| [`docs/reminder-system.md`](docs/reminder-system.md) | Reminder and dunning workflows |

---

# 🔒 Security Principles

PayPilot is designed around a simple principle:

> **Intelligence can be automated. Financial authority must remain controlled.**

Key safeguards include:

- Deterministic financial calculations
- AI tool-based data access
- Permission-based action execution
- Human approval for financial operations
- PayPal webhook signature verification
- Immutable audit logging
- Environment-based secret management
- No hardcoded production credentials

---

# 🧩 What Makes PayPilot Different?

```text
Traditional Dashboard
        ↓
      REPORT
        ↓
    Human Action
```

vs.

```text
                 PAYPILOT
                    ↓
              TRANSACTION DATA
                    ↓
          CUSTOMER INTELLIGENCE
                    ↓
           REVENUE RISK DETECTION
                    ↓
             AI EXPLANATION
                    ↓
          RECOVERY STRATEGY
                    ↓
          PERMISSION ENGINE
                    ↓
          HUMAN AUTHORIZATION
                    ↓
           PAYPAL WORKFLOW
                    ↓
            CUSTOMER PAYMENT
                    ↓
             WEBHOOK EVENT
                    ↓
            AUTOMATED UPDATE
```

**PayPilot turns payment data into an intelligent, controlled, event-driven revenue recovery system.**

---

# 🏆 Hackathon Value Proposition

### For Businesses

- Identify revenue leakage earlier
- Prioritize high-risk customers
- Understand changing payment behavior
- Automate repetitive recovery workflows
- Reduce manual revenue operations
- Maintain human control over financial actions

### For Revenue Teams

PayPilot transforms:

**"Who owes us money?"**

into:

**"Who is becoming risky, why are they risky, what action should we take, and what happened after the action?"**

---

# 📌 Project Status

**Hackathon Demo Ready**

The current implementation includes:

- ✅ Customer Intelligence
- ✅ Revenue Risk Detection
- ✅ AI Revenue Agent
- ✅ Tool Calling
- ✅ 4-Tier Permission Engine
- ✅ Human-in-the-Loop Authorization
- ✅ PayPal Workflow Integration
- ✅ Webhook Feedback Loop
- ✅ Automated Reminder Cancellation
- ✅ Audit Logging
- ✅ Demo Simulator
- ✅ Critical Integration Tests

---

# 📄 License

This project is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

## 🚀 PayPilot

> **From payment data → to customer intelligence → to revenue recovery.**

**AI that doesn't just explain your revenue — it helps you recover it, safely.**
