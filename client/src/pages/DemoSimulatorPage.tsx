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
  Sparkles,
  Check,
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Connecting to PayPal Sandbox & Demo Control Room...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            Hackathon Demo & PayPal Webhook Lab
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-400 border border-brand-500/30">
              Interactive Test Harness
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test real-world scenarios: deterministic behavioral deterioration, permission authorization safeguards, and instant reminder auto-cancellation upon payment.
          </p>
        </div>

        <button
          onClick={handleResetData}
          disabled={seeding}
          className="fintech-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <RotateCcw className={`h-4 w-4 ${seeding ? 'animate-spin text-brand-400' : ''}`} />
          <span>{seeding ? 'Reseeding...' : 'Reset Demo State'}</span>
        </button>
      </div>

      {/* 5-Step Evaluation Journey (Judge Walkthrough) */}
      <div className="fintech-card p-6">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Workflow className="h-4 w-4 text-brand-400" />
          <span>Evaluation Journey: TRUST → INTELLIGENCE → ACTION → CONTROL → RECOVERY</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-fintech-bg border border-fintech-border">
            <span className="text-[10px] font-bold text-brand-400 uppercase">1. Dashboard Hero</span>
            <p className="text-xs font-semibold text-slate-200 mt-1">Revenue At Risk</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Focal bar showing healthy, at-risk, and overdue revenue breakdown.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-fintech-bg border border-fintech-border">
            <span className="text-[10px] font-bold text-ai-400 uppercase">2. Customer 360</span>
            <p className="text-xs font-semibold text-slate-200 mt-1">"What Changed?"</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Side-by-side baseline vs recent 30-day telemetry shift.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-fintech-bg border border-fintech-border">
            <span className="text-[10px] font-bold text-ai-400 uppercase">3. Command Center</span>
            <p className="text-xs font-semibold text-slate-200 mt-1">AI Execution Trace</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Multi-step deterministic tool execution and reasoning.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-fintech-bg border border-fintech-border">
            <span className="text-[10px] font-bold text-warning-400 uppercase">4. Action Center</span>
            <p className="text-xs font-semibold text-slate-200 mt-1">Permission Engine</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Financial and communication actions require human approval.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-fintech-bg border border-fintech-border">
            <span className="text-[10px] font-bold text-success-400 uppercase">5. Webhook Loop</span>
            <p className="text-xs font-semibold text-slate-200 mt-1">Success Moment</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Payment verified → reminders automatically cancelled.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Subject: Alex Technologies */}
        <div className="fintech-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-fintech-border">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ai-400">Primary Demo Subject</span>
              <h3 className="text-base font-bold text-slate-100">Alex Technologies (INV-1024)</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning-500/10 text-warning-400 border border-warning-500/30">
              High Value • Deteriorating
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Alex Technologies is a loyal $18k+ customer who suddenly experienced payment delay increase (1.4d → 6.2d) and 2 invoice declines. PayPilot automatically drafted a tailored reminder, but staged it in the Action Center awaiting human approval.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/customers/cust-alex-tech')}
              className="fintech-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <span>View Customer 360</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => navigate('/action-center')}
              className="fintech-btn-primary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Inspect Action Center</span>
            </button>
          </div>
        </div>

        {/* Real-time Webhook Dispatcher */}
        <div className="fintech-card p-6 space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-success-400">Feedback Loop Trigger</span>
            <h3 className="text-base font-bold text-slate-100">Simulate Payment Received Webhook</h3>
            <p className="text-xs text-slate-400 mt-1">
              Dispatches `PAYMENT.CAPTURE.COMPLETED` for $450 against invoice #INV-1024 to verify instant reminder cancellation.
            </p>
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={simulatingWebhook}
            className="fintech-btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            {simulatingWebhook ? (
              <span>Verifying Webhook Event...</span>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Simulate $450 Payment from Alex Technologies</span>
              </>
            )}
          </button>

          {webhookResult && (
            <div className="p-4 rounded-xl bg-success-500/5 border border-success-500/30 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-success-400 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>{webhookResult.message}</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Active reminders for Alex Technologies have been automatically transitioned to <strong className="text-slate-100">CANCELLED</strong> to prevent merchant-client embarrassment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
