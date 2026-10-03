# Customer Intelligence Engine

The Customer Intelligence Engine transforms raw PayPal transactions into deep behavioral context.

## 1. Metrics Calculated Per Customer

- **Payment Behavior**: Total transactions, successful vs failed, payment delay days (time elapsed between invoice issue/due date and final settlement), on-time payment %, overdue frequency, failure rate.
- **Revenue Contribution**: Lifetime volume, 30-day, 90-day, and 365-day run rates, percentage contribution to merchant total revenue.
- **Outstanding Activity**: Outstanding balance, count of overdue invoices, days overdue, recent failed amounts.
- **Reminder Sensitivity**: Reminders sent, reminders converted to paid, conversion rate %, average time to settlement after notification.
- **Behavioral Shift**: Historical delay baseline vs recent 30-day delay, failure count variance.
- **Deterministic Risk Score**: 0 to 100 score based on overdue duration, recent declines, and delay increases.

---

## 2. Customer Segments

Segments are calculated mathematically:

- **HIGH_VALUE**: Lifetime Revenue >= $5,000 OR >10% of total merchant revenue.
- **AT_RISK**: Risk Score >= 45 OR Overdue > 10 days OR >= 2 recent failed payments.
- **OVERDUE**: Unsettled invoices past due date.
- **REMINDER_RESPONSIVE**: Conversion rate >= 50% with at least 1 historical reminder.
- **DECLINING**: Recent 30D revenue drop > 50% vs historical monthly average OR payment delay increased by > 2.5 days.
- **RELIABLE**: On-time rate >= 85%, failure rate <= 5%, zero overdue balance.
- **NEW**: First seen within 30 days and <= 2 transactions.
- **INACTIVE**: No transaction activity in 90+ days.
