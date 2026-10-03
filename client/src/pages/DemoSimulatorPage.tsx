import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Workflow,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Send,
  Bot,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { loadDemoSession } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/demo/status');
      setStatus(res.data);
    } catch (e) {
      console.error('Failed to load demo status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResetData = async () => {
    setSeeding(true);
    try {
      await loadDemoSession();
      await fetchStatus();
      setWebhookResult(null);
    } finally {
      setSeeding(false);
    }
  };

  const handleSimulatePayment = async () => {
    setSimulatingWebhook(true);
    try {
      const res = await api.post('/webhooks/simulate', {
        eventType: 'PAYMENT.CAPTURE.COMPLETED',
        invoiceNumber: status?.demoHighlight?.alexInvoiceNumber || 'INV-1024',
        amount: 450,
      });
      setWebhookResult(res.data);
      await fetchStatus();
    } catch (e: any) {
      alert(`Simulation failed: ${e.response?.data?.error || e.message}`);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Connecting to PayPal Sandbox & Demo Control Room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Hackathon Demo & PayPal Webhook Lab
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
              Interactive Test Harness
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test real-world scenarios: deterministic behavioral deterioration, permission authorization blocks, and instant reminder auto-cancellation upon payment.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={seeding}
          className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition-colors"
        >
          <RotateCcw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Re-seeding Nova Digital...' : 'Reset Demo Business (Nova Digital Studio)'}</span>
        </button>
      </div>

      {/* Demo Scenario Highlight Card */}
      <div className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600/20 border border-blue-500/30 p-2.5 text-blue-400 font-bold">
              <Workflow className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Active Evaluation Scenario: Alex Technologies</h3>
              <p className="text-xs text-slate-400">
                Key customer whose payment discipline recently degraded from 1.4d historical delay to 6.2d delay with 2 recent payment declines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              {status?.counts?.customers || 32} Customers
            </span>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/30">
              {status?.counts?.transactions || 100}+ Transactions
            </span>
          </div>
        </div>

        {/* 3 Step Interactive Testing Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Action 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <span>1. Behavioral Analysis</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Inspect "What Changed?"</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Open Alex Technologies' 360 profile to observe deterministic delta calculations comparing historical vs recent activity.
              </p>
            </div>
            <button
              onClick={() => status?.demoHighlight?.alexCustomerId && navigate(`/customers/${status.demoHighlight.alexCustomerId}`)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 px-3 py-2 text-xs font-bold text-blue-300 hover:text-white transition-colors"
            >
              <span>Inspect Alex Profile</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <span>2. AI Recovery Staging</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Stage & Review Reminder</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The Recovery Agent prepares a reminder for invoice #{status?.demoHighlight?.alexInvoiceNumber || 'INV-1024'} and routes to Action Center.
              </p>
            </div>
            <button
              onClick={() => navigate('/action-center')}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-amber-300 hover:text-white transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Review Action Center</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <span>3. PayPal Webhook Feedback Loop</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">Simulate PayPal Settlement</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dispatch verified webhook payment event. Observe invoice marked PAID and future scheduled reminders automatically cancelled!
              </p>
            </div>
            <button
              onClick={handleSimulatePayment}
              disabled={simulatingWebhook}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{simulatingWebhook ? 'Dispatched...' : 'Simulate $450 Payment'}</span>
            </button>
          </div>
        </div>

        {/* Live Simulation Response Output */}
        {webhookResult && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-5 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{webhookResult.message}</span>
              </span>
              <button
                onClick={() => navigate('/reminders')}
                className="underline hover:text-white"
              >
                Verify Cancelled Reminders →
              </button>
            </div>
            <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
              <pre>{JSON.stringify(webhookResult.mockEvent, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
