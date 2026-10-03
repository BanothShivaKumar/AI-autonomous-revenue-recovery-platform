# PayPilot AI Agent & Tool Calling Architecture

## 1. Core Differentiator: Explain, Don't Invent

PayPilot strictly enforces deterministic financial calculations:
- The LLM **never calculates or guesses revenue, outstanding amounts, or delinquency periods**.
- Mathematical aggregations, delta comparisons, and aging brackets are calculated in pure TypeScript backend logic.
- The AI Agent executes controlled backend tools, inspects the verified JSON result, and constructs clear natural language explanations.

---

## 2. Explicit Controlled Tools

The AI operates through registered function tools (`server/src/services/ai/aiTools.ts`):

1. `get_transactions(status, limit)`
2. `get_customers(segment, limit)`
3. `get_customer_profile(customerId, customerName)`
4. `analyze_customer_behavior_change(customerId, customerName)` ("What Changed?")
5. `calculate_revenue_metrics()`
6. `identify_overdue_invoices(minDaysOverdue)`
7. `identify_failed_payments(limit)`
8. `identify_revenue_risk()`
9. `prepare_recovery_plan(minDaysOverdue)`
10. `execute_batch_recovery(minDaysOverdue)`
11. `simulate_recovery_scenario(recoveryRatePercent)`
12. `get_reminder_policy()`

---

## 3. The 3 Specialized Agents

### A. Revenue Intelligence Agent
Monitors processed volume, outstanding accounts receivable, and root causes for revenue shifts.

### B. Customer Intelligence Agent
Evaluates customer behavioral discipline, analyzes payment delays, and powers the "What Changed?" baseline comparison.

### C. Revenue Recovery Agent
Synthesizes signals from overdue invoices, failed transactions, and reminder conversion history to prepare personalized recovery workflows routed through the Action Center.
