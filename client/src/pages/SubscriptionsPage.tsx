import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CreditCard, Repeat, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data.subscriptions || []);
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading PayPal Subscription Agreements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
          Subscriptions & Recurring Revenue
          <span className="rounded-full bg-ai-500/10 px-2.5 py-0.5 text-xs font-bold text-ai-400 border border-ai-500/30">
            {subscriptions.length} Plans
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor recurring PayPal billing agreements, track payment retry attempts, and detect subscription churn risk.
        </p>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions.map((sub) => {
          const isPastDue = sub.status === 'PAST_DUE' || sub.failedAttempts > 0;
          return (
            <div
              key={sub.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isPastDue
                  ? 'border-warning-500/40 bg-fintech-surface shadow-card'
                  : 'border-fintech-border bg-fintech-surface'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {sub.planName}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      sub.status === 'ACTIVE'
                        ? 'bg-success-500/10 text-success-400 border-success-500/30'
                        : isPastDue
                        ? 'bg-warning-500/10 text-warning-400 border-warning-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    ● {sub.status}
                  </span>
                </div>

                <div
                  onClick={() => navigate(`/customers/${sub.customerId}`)}
                  className="mt-4 cursor-pointer group"
                >
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-brand-400 transition-colors">
                    {sub.customer?.name}
                  </h3>
                  <p className="text-xs text-slate-400">{sub.customer?.email}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-fintech-border space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-medium">Billing Rate:</span>
                  <span className="font-bold text-slate-100 font-mono">
                    ${sub.amount?.toLocaleString()} / {sub.billingCycle?.toLowerCase()}
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400 font-medium">Next Billing Date:</span>
                  <span className="font-mono text-slate-300">
                    {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {sub.failedAttempts > 0 && (
                  <div className="flex justify-between text-risk-400 font-medium">
                    <span>Failed Billing Retries:</span>
                    <span className="font-bold font-mono">{sub.failedAttempts} attempts</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
