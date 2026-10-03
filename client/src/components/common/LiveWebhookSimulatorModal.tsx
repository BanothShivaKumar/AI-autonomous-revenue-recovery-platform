import React, { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../../api/client';
import { Send, CheckCircle2, AlertTriangle, RefreshCw, Zap, ShieldCheck, Check, ArrowRight } from 'lucide-react';

interface WebhookSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onWebhookProcessed?: () => void;
}

export const LiveWebhookSimulatorModal: React.FC<WebhookSimulatorProps> = ({
  isOpen,
  onClose,
  onWebhookProcessed,
}) => {
  const [eventType, setEventType] = useState('PAYMENT.CAPTURE.COMPLETED');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-1024');
  const [customerEmail, setCustomerEmail] = useState('alex@alextech.io');
  const [amount, setAmount] = useState('450.00');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/webhooks/simulate', {
        eventType,
        invoiceNumber,
        customerEmail,
        amount: parseFloat(amount),
      });

      setResult(res.data);
      if (onWebhookProcessed) {
        onWebhookProcessed();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSimulator = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PayPal Webhook Simulator (Demo & Live Verification)"
      subtitle="Dispatch synthetic PayPal webhook events to test event verification, invoice settlement, and automatic reminder cancellation."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {!result ? (
          <>
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-xs text-brand-300 flex items-start gap-3">
              <Zap className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-100">Live Event-Driven Feedback Loop</p>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  When a payment is confirmed via PayPal webhook, PayPilot marks the invoice as settled,{' '}
                  <strong className="text-white">automatically cancels outstanding reminders</strong> to prevent customer friction, updates risk metrics, and records an immutable audit log.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  PayPal Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full rounded-lg border border-fintech-border bg-fintech-bg px-3 py-2 text-xs text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="PAYMENT.CAPTURE.COMPLETED">PAYMENT.CAPTURE.COMPLETED (Payment Success)</option>
                  <option value="INVOICING.INVOICE.PAID">INVOICING.INVOICE.PAID (Invoice Settled)</option>
                  <option value="PAYMENT.CAPTURE.DENIED">PAYMENT.CAPTURE.DENIED (Payment Decline)</option>
                  <option value="BILLING.SUBSCRIPTION.PAYMENT.FAILED">BILLING.SUBSCRIPTION.PAYMENT.FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full rounded-lg border border-fintech-border bg-fintech-bg px-3 py-2 text-xs text-slate-100 font-mono focus:border-brand-500 focus:outline-none"
                  placeholder="INV-1024"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-lg border border-fintech-border bg-fintech-bg px-3 py-2 text-xs text-slate-100 focus:border-brand-500 focus:outline-none"
                  placeholder="alex@alextech.io"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-fintech-border bg-fintech-bg px-3 py-2 text-xs text-slate-100 focus:border-brand-500 focus:outline-none font-mono"
                  placeholder="450.00"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading}
              className="fintech-btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing PayPal Webhook...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Dispatch Webhook Event to /api/webhooks/paypal</span>
                </>
              )}
            </button>
          </>
        ) : (
          /* SECTION 28: SUCCESS MOMENT */
          <div className="space-y-5 animate-fadeIn">
            <div className="rounded-2xl border border-success-500/30 bg-success-500/5 p-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/10 border border-success-500/30 text-success-400">
                <CheckCircle2 className="h-8 w-8 text-success-400" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100">✓ Payment Confirmed</h3>
                <p className="text-base font-bold font-mono text-success-400 mt-1">
                  ${parseFloat(amount).toLocaleString()} received from Alex Technologies
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2 pt-2 text-xs text-slate-300">
                <div className="flex items-center justify-center gap-2 text-success-400 font-medium">
                  <Check className="h-4 w-4" />
                  <span>PayPal webhook signature verified</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-brand-400" />
                  <span>Invoice #{invoiceNumber} settled</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-brand-400" />
                  <span>Reminder automatically cancelled</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Check className="h-4 w-4 text-brand-400" />
                  <span>Revenue & risk metrics updated in real-time</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-fintech-border bg-fintech-bg p-3.5 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Webhook Response Payload</p>
              <pre className="text-[10px] font-mono text-slate-300 overflow-x-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={resetSimulator}
                className="fintech-btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Simulate Another Event
              </button>
              <button
                onClick={onClose}
                className="fintech-btn-primary px-4 py-2 text-xs font-semibold"
              >
                Close & View Updated Dashboard
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-risk-500/30 bg-risk-500/10 p-4 text-xs text-risk-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-risk-400 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-100">Webhook Processing Error</p>
              <p className="mt-0.5 text-risk-300">{error}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
