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
  const [whatChangedModalOpen, setWhatChangedModalOpen] = useState(false);
  const [whatChangedAnalysis, setWhatChangedAnalysis] = useState<any>(null);
  const [analyzingChange, setAnalyzingChange] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminder, setSendingReminder] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setData(res.data);
    } catch (e) {
      console.error('Failed to load customer profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleRunWhatChanged = async () => {
    setWhatChangedModalOpen(true);
    setAnalyzingChange(true);
    try {
      const res = await api.get(`/customers/${id}/what-changed`);
      setWhatChangedAnalysis(res.data.analysis);
    } catch (e) {
      console.error('Failed to run what-changed analysis:', e);
    } finally {
      setAnalyzingChange(false);
    }
  };

  const handleOpenReminderModal = (inv: any) => {
    setSelectedInvoice(inv);
    setReminderMessage(
      `Hi ${data?.customer?.name},\n\nJust a friendly reminder that invoice #${inv.invoiceNumber} for $${inv.amount.toFixed(
        2
      )} is currently outstanding.\n\nYou can settle your payment securely via PayPal: https://www.sandbox.paypal.com/invoice/p/#${
        inv.paypalInvoiceId || inv.invoiceNumber
      }\n\nThank you,\nNova Digital Studio`
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
      fetchCustomer();
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Building Customer 360 Telemetry Profile...</span>
        </div>
      </div>
    );
  }

  const customer = data?.customer || {};
  const metrics = data?.metrics || {};
  const monthlyData = data?.monthlyData || [];

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </button>

        {/* What Changed Button */}
        <button
          onClick={handleRunWhatChanged}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all active:scale-95"
        >
          <Sparkles className="h-4 w-4" />
          <span>"What Changed?" AI Analysis</span>
        </button>
      </div>

      {/* Customer Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl shadow-lg shadow-blue-500/20">
              {customer.name?.slice(0, 2).toUpperCase() || 'CU'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">{customer.name}</h1>
                <SegmentBadge segment={metrics.suggestedSegment || customer.segment} />
                <RiskBadge score={metrics.riskScore || 0} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {customer.company && <span className="text-slate-300 font-semibold">{customer.company} • </span>}
                {customer.email}
              </p>
              {customer.notes && (
                <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 w-fit">
                  {customer.notes}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifetime Revenue</p>
              <p className="text-lg font-bold text-white font-mono mt-0.5">${metrics.lifetimeRevenue?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding</p>
              <p className={`text-lg font-bold font-mono mt-0.5 ${metrics.outstandingInvoiceAmount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                ${metrics.outstandingInvoiceAmount?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On-Time Rate</p>
              <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{metrics.onTimePaymentPercentage?.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Delay</p>
              <p className="text-lg font-bold text-slate-200 font-mono mt-0.5">{metrics.averagePaymentDelayDays?.toFixed(1)}d</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Behavioral Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History Monthly Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-sm font-bold text-white">Payment Volume Over Time</h3>
          <p className="text-xs text-slate-400 mb-4">Historical monthly payments processed through PayPal</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v: any) => [`$${v.toLocaleString()}`, 'Processed Amount']}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Indicators Checklist */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Payment Risk Indicators</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Transparent deterministic rules</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                <span className="text-slate-300">Payment delay increasing</span>
                {metrics.delayChangeDays > 2.0 ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold font-mono">
                    ✓ (+{metrics.delayChangeDays.toFixed(1)}d)
                  </span>
                ) : (
                  <span className="text-slate-600 font-mono">✕</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                <span className="text-slate-300">Recent failed payments</span>
                {metrics.recentFailureCount > 0 ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold font-mono">
                    ✓ ({metrics.recentFailureCount} failures)
                  </span>
                ) : (
                  <span className="text-slate-600 font-mono">✕</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                <span className="text-slate-300">Outstanding overdue invoice</span>
                {metrics.outstandingInvoiceAmount > 0 ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                    ✓ (${metrics.outstandingInvoiceAmount})
                  </span>
                ) : (
                  <span className="text-slate-600 font-mono">✕</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs">
                <span className="text-slate-300">Recent revenue decline</span>
                {metrics.historicalRevenueMonthlyAvg > 200 && metrics.recentRevenue30d < metrics.historicalRevenueMonthlyAvg * 0.5 ? (
                  <span className="flex items-center gap-1 text-amber-400 font-bold font-mono">✓</span>
                ) : (
                  <span className="text-slate-600 font-mono">✕</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Composite Score: <strong className="text-white font-mono">{metrics.riskScore}/100</strong> (Calculated deterministically)
          </div>
        </div>
      </div>

      {/* Invoices & Reminders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Invoices */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-400" />
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">#{inv.invoiceNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isOverdue
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
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
                    <span className="font-mono font-bold text-white text-sm">${inv.amount.toLocaleString()}</span>
                    {inv.status !== 'PAID' && (
                      <button
                        onClick={() => handleOpenReminderModal(inv)}
                        className="flex items-center gap-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 px-2.5 py-1 text-xs font-semibold text-blue-300 hover:text-white border border-blue-500/30 transition-colors"
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-400" />
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">Reminder #{rem.reminderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rem.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : rem.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-blue-500/10 text-blue-400'
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

      {/* "What Changed?" AI Analysis Modal */}
      <Modal
        isOpen={whatChangedModalOpen}
        onClose={() => setWhatChangedModalOpen(false)}
        title={`Customer Behavior Shift: ${customer.name}`}
        subtitle="Comparing 90-day baseline against recent 30-day PayPal telemetry"
        maxWidth="max-w-3xl"
      >
        {analyzingChange ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-blue-400 text-sm">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Analyzing historical transactions vs recent payment events...</span>
            </div>
          </div>
        ) : whatChangedAnalysis ? (
          <div className="space-y-5">
            {/* Status Banner */}
            <div
              className={`rounded-xl border p-4 flex items-start gap-3 ${
                whatChangedAnalysis.overallStatus === 'CRITICAL'
                  ? 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                  : whatChangedAnalysis.overallStatus === 'DETERIORATING'
                  ? 'border-amber-500/30 bg-amber-950/30 text-amber-300'
                  : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">
                  Status: {whatChangedAnalysis.overallStatus}
                </h4>
                <p className="text-xs mt-1 leading-relaxed">{whatChangedAnalysis.aiAssessment}</p>
              </div>
            </div>

            {/* Baseline vs Recent Comparison Table */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Historical Baseline (90 Days)
                </p>
                <div className="flex justify-between text-slate-300">
                  <span>90D Revenue:</span>
                  <span className="font-mono font-semibold text-white">
                    ${whatChangedAnalysis.historicalBaseline.revenue90d.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Avg Payment Delay:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {whatChangedAnalysis.historicalBaseline.averagePaymentDelayDays.toFixed(1)} days
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Failed Payments:</span>
                  <span className="font-mono font-semibold text-slate-300">
                    {whatChangedAnalysis.historicalBaseline.failedPaymentCount}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Recent Activity (Last 30 Days)
                </p>
                <div className="flex justify-between text-slate-300">
                  <span>30D Revenue:</span>
                  <span className="font-mono font-semibold text-white">
                    ${whatChangedAnalysis.recentBehavior.revenue30d.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recent Payment Delay:</span>
                  <span className="font-mono font-semibold text-rose-400">
                    {whatChangedAnalysis.recentBehavior.averagePaymentDelayDays.toFixed(1)} days
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recent Failed Payments:</span>
                  <span className="font-mono font-semibold text-rose-400">
                    {whatChangedAnalysis.recentBehavior.failedPaymentCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Findings List */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Findings</h5>
              <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                {whatChangedAnalysis.keyFindings.map((f: string, i: number) => (
                  <li key={i} className="leading-relaxed">{f}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Action Box */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Recommended Recovery Action</h5>
              <p className="text-xs text-slate-200 leading-relaxed">{whatChangedAnalysis.recommendedAction}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Manual Reminder Trigger Modal */}
      <Modal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title={`Prepare Payment Reminder: #${selectedInvoice?.invoiceNumber}`}
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>

          <button
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {sendingReminder ? 'Dispatching...' : 'Dispatch Reminder via PayPal'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
