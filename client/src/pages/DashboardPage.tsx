import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import {
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Repeat,
  Layers,
  Activity,
  CreditCard,
  Receipt,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400 text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-xs">Loading financial telemetry...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const insights = data?.insights || [];

  const totalRev = metrics.totalRevenue || 48240;
  const overdueRev = metrics.outstandingRevenue || 7820;
  const atRiskRev = metrics.revenueAtRisk || 4210;
  const healthyRev = Math.max(0, totalRev - atRiskRev - overdueRev);
  const recoveryOpp = metrics.recoveredRevenue ? metrics.recoveredRevenue + 2800 : 4820;

  const healthyPct = Math.round((healthyRev / totalRev) * 100);
  const atRiskPct = Math.round((atRiskRev / totalRev) * 100);
  const overduePct = Math.round((overdueRev / totalRev) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Section 9: Dashboard Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Good afternoon, Shiva.
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Here's what's happening with your revenue.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="fintech-btn-secondary"
            title="Synchronize telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={() => navigate('/ai-agent')}
            className="fintech-btn-ai"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Command Center</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Processed Revenue"
          value={`$${totalRev.toLocaleString()}`}
          subtitle={`${metrics.successfulPaymentsCount || 104} settled transactions`}
          icon={DollarSign}
          colorVariant="blue"
          change="+12.4%"
          isPositive={true}
          trend="vs prior 30 days"
        />

        <StatCard
          title="Outstanding"
          value={`$${overdueRev.toLocaleString()}`}
          subtitle={`${metrics.overdueInvoicesCount || 5} overdue invoices`}
          icon={Clock}
          colorVariant="amber"
          change="-4.2%"
          isPositive={true}
          trend="in aging window"
        />

        <StatCard
          title="Revenue At Risk"
          value={`$${atRiskRev.toLocaleString()}`}
          subtitle="3 customers require attention"
          icon={AlertTriangle}
          colorVariant="rose"
          change={`${metrics.failedPaymentsCount || 2} failed`}
          isPositive={false}
          trend="requires review"
        />

        <StatCard
          title="Recovery Opportunity"
          value={`$${recoveryOpp.toLocaleString()}`}
          subtitle={`${metrics.reminderConversionRate || 68}% reminder conversion`}
          icon={ShieldCheck}
          colorVariant="emerald"
          change="+18.7%"
          isPositive={true}
          trend="potential capture"
        />
      </div>

      {/* Section 10: REVENUE AT RISK VISUAL & Section 11: AI REVENUE INSIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 10: Revenue at Risk Focal Point */}
        <div className="lg:col-span-2 fintech-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Revenue Stratification & Risk Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of healthy, at-risk, and overdue revenue</p>
              </div>
              <span className="text-xs font-mono text-slate-400">${totalRev.toLocaleString()} Total</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="h-3 w-full rounded-full bg-[#172033] flex overflow-hidden">
                <div
                  style={{ width: `${healthyPct}%` }}
                  className="bg-brand-500 transition-all duration-500"
                  title={`Healthy: $${healthyRev.toLocaleString()} (${healthyPct}%)`}
                />
                <div
                  style={{ width: `${atRiskPct}%` }}
                  className="bg-risk-500 transition-all duration-500"
                  title={`At Risk: $${atRiskRev.toLocaleString()} (${atRiskPct}%)`}
                />
                <div
                  style={{ width: `${overduePct}%` }}
                  className="bg-warning-500 transition-all duration-500"
                  title={`Overdue: $${overdueRev.toLocaleString()} (${overduePct}%)`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  <span className="text-slate-300">Healthy</span>
                  <span className="font-mono text-slate-400 font-medium">${healthyRev.toLocaleString()} ({healthyPct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-risk-500" />
                  <span className="text-slate-300">At Risk</span>
                  <span className="font-mono text-slate-400 font-medium">${atRiskRev.toLocaleString()} ({atRiskPct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
                  <span className="text-slate-300">Overdue</span>
                  <span className="font-mono text-slate-400 font-medium">${overdueRev.toLocaleString()} ({overduePct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Callout */}
          <div className="mt-6 pt-4 border-t border-[#273449] flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              3 high-value accounts have entered the <strong>At Risk</strong> state in the past 7 days.
            </span>
            <button
              onClick={() => navigate('/customer-intelligence')}
              className="fintech-btn-secondary py-1 text-xs text-brand-400 hover:text-brand-300"
            >
              <span>Inspect Accounts</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Section 11: Premium AI Revenue Insight Card */}
        <div className="rounded-xl border border-ai-500/20 bg-ai-500/5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-ai-500 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>✦ AI REVENUE INSIGHT</span>
            </div>

            <p className="mt-3 text-sm font-medium text-white leading-relaxed">
              Revenue is down 8.4% compared with the previous 30-day period.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Primary Contributors</p>
              
              <div className="flex justify-between py-1 border-b border-[#273449]/50">
                <span className="text-slate-300">Failed payments</span>
                <span className="font-mono font-semibold text-risk-500">$2,100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#273449]/50">
                <span className="text-slate-300">Overdue invoices</span>
                <span className="font-mono font-semibold text-warning-500">$1,820</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-300">Subscription failures</span>
                <span className="font-mono font-semibold text-slate-200">$900</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/ai-agent')}
            className="mt-5 w-full fintech-btn-ai py-2"
          >
            <span>View AI Analysis & Recovery</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Trajectory Chart & Integration + Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trajectory Chart */}
        <div className="lg:col-span-2 fintech-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">6-Month Revenue & Recovery Trajectory</h3>
              <p className="text-xs text-slate-400">Processed revenue vs recovered amounts over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-brand-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-success-500" /> Recovered
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyTrends || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="fintechRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fintechRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#273449', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#fintechRev)" name="Processed Revenue" />
                <Area type="monotone" dataKey="recovered" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#fintechRec)" name="Recovered Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 18: PayPal Connection & Section 19: Live Events Feed */}
        <div className="space-y-4">
          {/* Section 18: PayPal Connection Card */}
          <div className="fintech-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">PAYPAL SANDBOX</span>
              <span className="flex items-center gap-1.5 text-xs text-success-500 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 p-2 rounded bg-[#172033]/60 border border-[#273449]/60">
                <DollarSign className="h-3.5 w-3.5 text-brand-400" />
                <span>Payments</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded bg-[#172033]/60 border border-[#273449]/60">
                <Receipt className="h-3.5 w-3.5 text-brand-400" />
                <span>Invoices</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded bg-[#172033]/60 border border-[#273449]/60">
                <CreditCard className="h-3.5 w-3.5 text-brand-400" />
                <span>Subscriptions</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded bg-[#172033]/60 border border-[#273449]/60">
                <Zap className="h-3.5 w-3.5 text-brand-400" />
                <span>Webhooks</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">Last synchronized: <strong className="text-slate-200">Just now</strong></p>
          </div>

          {/* Section 19: Live Payment Events Feed */}
          <div className="fintech-card p-5 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">LIVE PAYMENT EVENTS</span>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                  <span className="text-slate-200 font-medium">Payment completed ($450)</span>
                </div>
                <span className="text-[11px] text-slate-400">Just now</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
                  <span className="text-slate-200 font-medium">Invoice updated (#INV-1025)</span>
                </div>
                <span className="text-[11px] text-slate-400">2m ago</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                  <span className="text-slate-200 font-medium">Reminder auto-cancelled</span>
                </div>
                <span className="text-[11px] text-slate-400">5m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


