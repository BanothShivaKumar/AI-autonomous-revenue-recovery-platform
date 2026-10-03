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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Loading PayPal Subscription Agreements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          Subscriptions & Recurring Revenue
          <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
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
                  ? 'border-rose-500/40 bg-rose-950/20 shadow-lg'
                  : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      sub.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {sub.status}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">${sub.amount}/{sub.billingCycle.toLowerCase()}</span>
                </div>

                <h3 className="text-sm font-bold text-white mt-3">{sub.planName}</h3>
                <p
                  onClick={() => navigate(`/customers/${sub.customer?.id}`)}
                  className="text-xs text-slate-400 mt-0.5 hover:text-blue-400 cursor-pointer font-semibold"
                >
                  {sub.customer?.name} ({sub.customer?.company || sub.customer?.email})
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>PayPal Agreement ID:</span>
                  <span className="font-mono text-slate-300">{sub.paypalSubscriptionId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Next Billing Date:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
                {sub.failedAttempts > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold">
                    <span>Failed Retries:</span>
                    <span className="font-mono">{sub.failedAttempts} attempts</span>
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
