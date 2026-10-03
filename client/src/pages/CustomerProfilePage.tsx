import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { SegmentBadge, RiskBadge } from '../components/common/Badges';
import { Modal } from '../components/common/Modal';
import {
  User,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Receipt,
  Repeat,
  Bell,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldAlert,
  Send,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const CustomerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [whatChangedAnalysis, setWhatChangedAnalysis] = useState<any>(null);
  const [analyzingChange, setAnalyzingChange] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);
  const [actionPreparedSuccess, setActionPreparedSuccess] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setData(res.data);
      // Automatically load What Changed telemetry
      fetchWhatChanged();
    } catch (e) {
      console.error('Failed to load customer profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatChanged = async () => {
    setAnalyzingChange(true);
    try {
      const res = await api.get(`/customers/${id}/what-changed`);
      setWhatChangedAnalysis(res.data.analysis);
    } catch (e) {
      console.error('Failed to load what-changed:', e);
    } finally {
      setAnalyzingChange(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleOpenReminderModal = (inv?: any) => {
    const targetInv = inv || data?.customer?.invoices?.find((i: any) => i.status !== 'PAID') || data?.customer?.invoices?.[0];
    setSelectedInvoice(targetInv);
    setReminderMessage(
      `Hi ${data?.customer?.name},\n\nThis is a friendly reminder that invoice #${targetInv?.invoiceNumber || 'INV-1024'} for $${(targetInv?.amount || 450).toFixed(
        2
      )} is currently awaiting payment.\n\nYou can settle your payment securely via PayPal: https://www.sandbox.paypal.com/invoice/p/#${
        targetInv?.paypalInvoiceId || targetInv?.invoiceNumber || 'INV-1024'
      }\n\nThank you,\nPayPilot Financial Operations`
    );
    setReminderModalOpen(true);
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice) return;
    setSendingReminder(true);
    try {
      await api.post(`/invoices/${selectedInvoice.id}/remind`, {
        messageContent: reminderMessage,
      });
      setReminderModalOpen(false);
      setActionPreparedSuccess(true);
      fetchCustomer();
      setTimeout(() => setActionPreparedSuccess(false), 4000);
    } catch (e) {
      console.error('Failed to send reminder:', e);
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Building Customer 360 Telemetry Profile...</span>
        </div>
      </div>
    );
  }

  const customer = data?.customer || {};
  const metrics = data?.metrics || {};
  const monthlyData = data?.monthlyData || [];

  // Comparison metrics for "WHAT CHANGED?"
  const baselineDelay = whatChangedAnalysis?.historicalBaseline?.averagePaymentDelayDays ?? 1.4;
  const recentDelay = whatChangedAnalysis?.recentBehavior?.averagePaymentDelayDays ?? (metrics.averagePaymentDelayDays || 6.2);
  const baselineFailures = whatChangedAnalysis?.historicalBaseline?.failedPaymentCount ?? 0;
  const recentFailures = whatChangedAnalysis?.recentBehavior?.failedPaymentCount ?? (metrics.recentFailureCount || 2);
  const baselineRev = whatChangedAnalysis?.historicalBaseline?.revenue90d ? Math.round(whatChangedAnalysis.historicalBaseline.revenue90d / 3) : 2100;
  const recentRev = whatChangedAnalysis?.recentBehavior?.revenue30d ?? (metrics.recentRevenue30d || 620);
  const baselineOutstanding = 0;
  const recentOutstanding = metrics.outstandingInvoiceAmount || 450;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </button>

        {actionPreparedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-500/10 border border-success-500/30 text-success-400 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="h-4 w-4" />
            <span>Payment reminder staged & dispatched via PayPal</span>
          </div>
        )}
      </div>

      {/* Customer 360 Header Card */}
      <div className="fintech-card p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold text-xl shrink-0">
              {customer.name?.slice(0, 2).toUpperCase() || 'CU'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{customer.name}</h1>
                <SegmentBadge segment={metrics.suggestedSegment || customer.segment} />
                <RiskBadge score={metrics.riskScore || 0} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                {customer.company && <span className="text-slate-300 font-medium">{customer.company} •</span>}
                <span className="font-mono text-slate-400">{customer.email}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">ID: {customer.paypalCustomerId || customer.id?.slice(0, 8)}</span>
              </p>
              {customer.notes && (
                <p className="text-xs text-slate-300 mt-2.5 bg-fintech-bg/80 px-3 py-1.5 rounded-lg border border-fintech-border/80 w-fit">
                  {customer.notes}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-fintech-border pt-4 md:pt-0 md:pl-6 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifetime Revenue</p>
              <p className="text-lg font-bold text-slate-100 font-mono mt-0.5">${metrics.lifetimeRevenue?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding</p>
              <p className={`text-lg font-bold font-mono mt-0.5 ${metrics.outstandingInvoiceAmount > 0 ? 'text-warning-400' : 'text-slate-400'}`}>
                ${metrics.outstandingInvoiceAmount?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Time Rate</p>
              <p className="text-lg font-bold text-success-400 font-mono mt-0.5">{metrics.onTimePaymentPercentage?.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Delay</p>
              <p className="text-lg font-bold text-slate-200 font-mono mt-0.5">{metrics.averagePaymentDelayDays?.toFixed(1)}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* SIGNATURE FEATURE: "WHAT CHANGED?" */}
      <div className="rounded-2xl border border-ai-500/30 bg-fintech-surface p-6 md:p-7 relative overflow-hidden shadow-card">
        {/* Subtle AI indicator line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ai-500 via-brand-500 to-transparent" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-fintech-border">
          <div>
            <div className="flex items-center gap-2 text-ai-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Signature Telemetry Feature</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-1">WHAT CHANGED?</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing 90-day baseline behavior against recent 30-day PayPal telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              (metrics.riskScore || 0) > 40
                ? 'bg-warning-500/10 text-warning-400 border-warning-500/30'
                : 'bg-success-500/10 text-success-400 border-success-500/30'
            }`}>
              {whatChangedAnalysis?.overallStatus || 'DETERIORATING'}
            </span>
            <button
              onClick={fetchWhatChanged}
              disabled={analyzingChange}
              className="p-2 rounded-lg border border-fintech-border text-slate-400 hover:text-slate-200 hover:bg-fintech-secondary transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${analyzingChange ? 'animate-spin text-ai-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Metric Shift Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {/* Payment delay */}
          <div className="p-4 rounded-xl bg-fintech-bg/70 border border-fintech-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment delay</p>
            <div className="flex items-baseline gap-2 mt-2 font-mono font-bold text-base">
              <span className="text-slate-400">{baselineDelay.toFixed(1)} days</span>
              <span className="text-slate-600 font-sans">→</span>
              <span className="text-risk-400">{recentDelay.toFixed(1)} days</span>
            </div>
            <p className="text-[11px] text-risk-400/80 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+{Math.max(0, recentDelay - baselineDelay).toFixed(1)}d latency</span>
            </p>
          </div>

          {/* Failed payments */}
          <div className="p-4 rounded-xl bg-fintech-bg/70 border border-fintech-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed payments</p>
            <div className="flex items-baseline gap-2 mt-2 font-mono font-bold text-base">
              <span className="text-slate-400">{baselineFailures}</span>
              <span className="text-slate-600 font-sans">→</span>
              <span className={recentFailures > 0 ? 'text-risk-400' : 'text-slate-200'}>{recentFailures}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {recentFailures > 0 ? `${recentFailures} recent webhook declines` : 'No recent failures'}
            </p>
          </div>

          {/* 30D revenue */}
          <div className="p-4 rounded-xl bg-fintech-bg/70 border border-fintech-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">30D revenue</p>
            <div className="flex items-baseline gap-2 mt-2 font-mono font-bold text-base">
              <span className="text-slate-400">${baselineRev.toLocaleString()}</span>
              <span className="text-slate-600 font-sans">→</span>
              <span className="text-slate-100">${recentRev.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Monthly normalized run-rate
            </p>
          </div>

          {/* Outstanding */}
          <div className="p-4 rounded-xl bg-fintech-bg/70 border border-fintech-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding</p>
            <div className="flex items-baseline gap-2 mt-2 font-mono font-bold text-base">
              <span className="text-slate-400">${baselineOutstanding}</span>
              <span className="text-slate-600 font-sans">→</span>
              <span className={recentOutstanding > 0 ? 'text-warning-400' : 'text-success-400'}>
                ${recentOutstanding.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-warning-400/80 mt-1 font-medium">
              {recentOutstanding > 0 ? 'Awaiting settlement' : 'Fully settled'}
            </p>
          </div>
        </div>

        {/* AI Interpretation & Action Recommendation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
          <div className="lg:col-span-2 p-4 rounded-xl bg-ai-500/5 border border-ai-500/20">
            <div className="flex items-center gap-2 text-ai-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>✦ AI INTERPRETATION</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {whatChangedAnalysis?.aiAssessment ||
                "Recent payment behavior is weaker than the customer's historical baseline. Payment delay has increased significantly and invoice latency indicates emerging operational risk."}
            </p>
            {whatChangedAnalysis?.keyFindings && whatChangedAnalysis.keyFindings.length > 0 && (
              <ul className="mt-2.5 space-y-1 text-[11px] text-slate-300">
                {whatChangedAnalysis.keyFindings.map((f: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-ai-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 rounded-xl bg-fintech-bg/80 border border-fintech-border flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RECOMMENDED ACTION</p>
              <p className="text-xs font-bold text-slate-200 mt-1">
                {whatChangedAnalysis?.recommendedAction || 'Prepare a payment reminder.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Personalized tone tailored to reminder-responsive segment.
              </p>
            </div>

            <button
              onClick={() => handleOpenReminderModal()}
              className="mt-4 fintech-btn-ai w-full py-2 text-xs flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Prepare Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Behavioral Risk Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History Monthly Trend Chart */}
        <div className="lg:col-span-2 fintech-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Payment Behavior Over Time</h3>
              <p className="text-xs text-slate-400">Monthly PayPal transaction volume and payment cadence</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#273449',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(v: any) => [`$${v.toLocaleString()}`, 'Processed Amount']}
                />
                <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Indicators Checklist */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-400" />
              <span>Payment Risk Indicators</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Deterministic evaluation rules</p>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-fintech-border bg-fintech-bg text-xs">
                <span className="text-slate-300">Payment delay increasing</span>
                {metrics.delayChangeDays > 2.0 ? (
                  <span className="flex items-center gap-1 text-risk-400 font-bold font-mono">
                    <Check className="h-3.5 w-3.5" /> (+{metrics.delayChangeDays.toFixed(1)}d)
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">✕</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-fintech-border bg-fintech-bg text-xs">
                <span className="text-slate-300">Recent failed payments</span>
                {metrics.recentFailureCount > 0 ? (
                  <span className="flex items-center gap-1 text-risk-400 font-bold font-mono">
                    <Check className="h-3.5 w-3.5" /> ({metrics.recentFailureCount} failures)
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">✕</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-fintech-border bg-fintech-bg text-xs">
                <span className="text-slate-300">Outstanding overdue invoice</span>
                {metrics.outstandingInvoiceAmount > 0 ? (
                  <span className="flex items-center gap-1 text-warning-400 font-bold font-mono">
                    <Check className="h-3.5 w-3.5" /> (${metrics.outstandingInvoiceAmount})
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">✕</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-fintech-border bg-fintech-bg text-xs">
                <span className="text-slate-300">Recent revenue decline</span>
                {metrics.historicalRevenueMonthlyAvg > 200 && metrics.recentRevenue30d < metrics.historicalRevenueMonthlyAvg * 0.5 ? (
                  <span className="flex items-center gap-1 text-warning-400 font-bold font-mono">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">✕</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-fintech-border text-[11px] text-slate-400 flex items-center justify-between">
            <span>Composite Risk Score:</span>
            <strong className="text-slate-100 font-mono">{metrics.riskScore || 0}/100</strong>
          </div>
        </div>
      </div>

      {/* Invoices & Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Invoices */}
        <div className="fintech-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-brand-400" />
              <span>Invoices & Recovery Status</span>
            </h3>
            <span className="text-xs text-slate-400">{customer.invoices?.length || 0} Invoices</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {customer.invoices?.map((inv: any) => {
              const isOverdue = inv.status === 'OVERDUE' || (inv.status === 'UNPAID' && new Date(inv.dueDate) < new Date());
              return (
                <div
                  key={inv.id}
                  className="rounded-xl border border-fintech-border bg-fintech-bg p-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 text-xs">#{inv.invoiceNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-success-500/10 text-success-400 border border-success-500/20'
                            : isOverdue
                            ? 'bg-risk-500/10 text-risk-400 border border-risk-500/20'
                            : 'bg-warning-500/10 text-warning-400 border border-warning-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Due {new Date(inv.dueDate).toLocaleDateString()} • {inv.reminders?.length || 0} reminders sent
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-100 text-sm">${inv.amount.toLocaleString()}</span>
                    {inv.status !== 'PAID' && (
                      <button
                        onClick={() => handleOpenReminderModal(inv)}
                        className="flex items-center gap-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/30 transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        <span>Remind</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminder History */}
        <div className="fintech-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-ai-400" />
              <span>Reminder Telemetry & Outcomes</span>
            </h3>
            <span className="text-xs text-slate-400">{customer.reminders?.length || 0} Historical</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {customer.reminders?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No previous reminders sent to this customer.</div>
            ) : (
              customer.reminders?.map((rem: any) => (
                <div
                  key={rem.id}
                  className="rounded-xl border border-fintech-border bg-fintech-bg p-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-xs">Reminder #{rem.reminderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rem.status === 'PAID'
                            ? 'bg-success-500/10 text-success-400'
                            : rem.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-brand-500/10 text-brand-400'
                        }`}
                      >
                        {rem.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{rem.messageContent}</p>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(rem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Manual Reminder Trigger Modal */}
      <Modal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title={`Prepare Payment Reminder: #${selectedInvoice?.invoiceNumber || 'INV-1024'}`}
        subtitle={`Sending via PayPal Invoicing API to ${customer.email}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Personalized Reminder Message
            </label>
            <textarea
              rows={6}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              className="w-full rounded-xl border border-fintech-border bg-fintech-bg p-3 text-xs text-slate-100 focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>

          <button
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="fintech-btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            {sendingReminder ? 'Dispatching...' : 'Dispatch Reminder via PayPal'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
