import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import {
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Repeat,
  Sparkles,
  ArrowUpRight,
  Bot,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Loading PayPilot Revenue Intelligence...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const insights = data?.insights || [];

  const agingData = [
    { name: '1-7 Days', amount: metrics.agingBuckets?.days1To7 || 0, fill: '#3b82f6' },
    { name: '8-14 Days', amount: metrics.agingBuckets?.days8To14 || 0, fill: '#f59e0b' },
    { name: '15-30 Days', amount: metrics.agingBuckets?.days15To30 || 0, fill: '#f97316' },
    { name: '30+ Days', amount: metrics.agingBuckets?.days30Plus || 0, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Executive Revenue Dashboard
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              Live Operations
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial telemetry, deterministic risk detection, and permission-controlled recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ai-agent')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
          >
            <Bot className="h-4 w-4" />
            <span>Launch AI Agent</span>
          </button>
        </div>
      </div>

      {/* AI Executive Insights Banner */}
      {insights.length > 0 && (
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900/60 p-5 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-blue-600/20 border border-blue-500/40 p-2.5 text-blue-400 shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">AI EXECUTIVE INSIGHT</span>
                  <span className="text-[11px] text-slate-400">• Deterministic Root Cause</span>
                </div>
                <h3 className="text-base font-bold text-white">{insights[0].title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{insights[0].summary}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/customer-intelligence')}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-800/40 transition-colors shrink-0"
            >
              <span>View Affected Accounts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Processed Revenue"
          value={`$${metrics.totalRevenue?.toLocaleString() || 0}`}
          subtitle={`${metrics.successfulPaymentsCount || 0} Successful PayPal Payments`}
          icon={DollarSign}
          colorVariant="blue"
          change={metrics.revenueChangePercentage >= 0 ? `+${metrics.revenueChangePercentage}%` : `${metrics.revenueChangePercentage}%`}
          isPositive={metrics.revenueChangePercentage >= 0}
          trend="vs prior 30 days"
        />

        <StatCard
          title="Outstanding Revenue"
          value={`$${metrics.outstandingRevenue?.toLocaleString() || 0}`}
          subtitle={`${metrics.overdueInvoicesCount || 0} Overdue Invoices`}
          icon={Clock}
          colorVariant="amber"
          change={`$${metrics.agingBuckets?.days1To7?.toLocaleString() || 0}`}
          trend="in 1-7 day aging window"
        />

        <StatCard
          title="Revenue At Risk"
          value={`$${metrics.revenueAtRisk?.toLocaleString() || 0}`}
          subtitle={`${metrics.customersAtRiskCount || 0} High-Risk Accounts`}
          icon={AlertTriangle}
          colorVariant="rose"
          change={`${metrics.failedPaymentsCount || 0} Failed Payments`}
          isPositive={false}
          trend="requiring attention"
        />

        <StatCard
          title="Recovered Revenue"
          value={`$${metrics.recoveredRevenue?.toLocaleString() || 0}`}
          subtitle={`${metrics.reminderConversionRate || 0}% Reminder Conversion`}
          icon={ShieldCheck}
          colorVariant="emerald"
          change="Automated Feedback Loop"
          isPositive={true}
          trend="via PayPilot actions"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Successful Payments</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">{metrics.successfulPaymentsCount || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Settled via PayPal balance/cards</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Failed Payments</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">{metrics.failedPaymentsCount || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payment declines & dunning</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Subscriptions</span>
            <Repeat className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">{metrics.activeSubscriptionsCount || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recurring billing agreements</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Reminder Conversion</span>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">{metrics.reminderConversionRate || 0}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payment within 48h of reminder</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">6-Month Revenue & Recovery Trajectory</h3>
              <p className="text-xs text-slate-400">Processed revenue vs recovered amounts over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Recovered
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyTrends || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Processed Revenue" />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" name="Recovered Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging Buckets Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Overdue Aging Buckets</h3>
            <p className="text-xs text-slate-400">Aging breakdown of current outstanding invoices</p>

            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, 'Outstanding']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> 1-7 Days (Gentle Reminders):</span>
              <span className="font-mono font-semibold">${metrics.agingBuckets?.days1To7?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> 8-14 Days (Follow-up):</span>
              <span className="font-mono font-semibold">${metrics.agingBuckets?.days8To14?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> 15+ Days (Merchant Review):</span>
              <span className="font-mono font-semibold">${((metrics.agingBuckets?.days15To30 || 0) + (metrics.agingBuckets?.days30Plus || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
