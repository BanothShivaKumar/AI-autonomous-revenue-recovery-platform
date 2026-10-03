import React, { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../../api/client';
import { Send, CheckCircle2, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PayPal Webhook Simulator (Demo & Evaluation)"
      subtitle="Dispatch synthetic PayPal webhook events to verify signature parsing, invoice settlement, and automatic reminder cancellation."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4 text-xs text-blue-200 flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-300">Live Event-Driven Feedback Loop</p>
            <p className="mt-1 text-slate-300">
              When a payment is confirmed via PayPal webhook, PayPilot marks the invoice as settled, <strong>automatically cancels future scheduled reminders</strong> to prevent client friction, updates the customer risk score, and writes to the compliance audit log.
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              placeholder="450.00"
            />
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
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

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold">Webhook Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>{result.message}</span>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-slate-300 overflow-x-auto max-h-40">
              <pre>{JSON.stringify(result.mockEvent, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
