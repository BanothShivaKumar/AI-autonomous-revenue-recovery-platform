import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BellRing,
  TrendingUp,
  Clock,
  ShieldCheck,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Save,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>({});
  const [policy, setPolicy] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    firstReminderDays: 1,
    secondReminderDays: 3,
    finalReminderDays: 7,
    maxReminders: 3,
    minIntervalDays: 2,
    stopOnPayment: true,
    requireApproval: true,
  });

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.reminders || []);
      setPerformance(res.data.performance || {});
      if (res.data.policy) {
        setPolicy(res.data.policy);
        setPolicyForm({
          firstReminderDays: res.data.policy.firstReminderDays || 1,
          secondReminderDays: res.data.policy.secondReminderDays || 3,
          finalReminderDays: res.data.policy.finalReminderDays || 7,
          maxReminders: res.data.policy.maxReminders || 3,
          minIntervalDays: res.data.policy.minIntervalDays || 2,
          stopOnPayment: res.data.policy.stopOnPayment ?? true,
          requireApproval: res.data.policy.requireApproval ?? true,
        });
      }
    } catch (e) {
      console.error('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await api.put('/reminders/policy', policyForm);
      setPolicyModalOpen(false);
      fetchReminders();
    } catch (e) {
      console.error('Failed to update policy:', e);
    } finally {
      setSavingPolicy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Loading Reminder Dunning Telemetry...</span>
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
            Payment Reminder Agent & Dunning Engine
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
              {performance.conversionRate || 0}% Conversion
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated, customer-centric reminder cadence with instant cancellation upon confirmed PayPal settlement.
          </p>
        </div>

        <button
          onClick={() => setPolicyModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
        >
          <Settings className="h-4 w-4 text-blue-400" />
          <span>Configure Reminder Policy</span>
        </button>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reminders Sent</p>
          <p className="text-2xl font-bold text-white font-mono mt-2">{performance.totalRemindersSent || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Automated & approved dispatches</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payments Recovered</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-2">{performance.totalPaymentsReceived || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Paid after receiving reminder</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recovered Revenue</p>
          <p className="text-2xl font-bold text-cyan-400 font-mono mt-2">${performance.totalRevenueRecovered?.toLocaleString() || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Total volume recovered</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Settlement Speed</p>
          <p className="text-2xl font-bold text-white font-mono mt-2">{performance.averageResponseTimeHours || 24}h</p>
          <p className="text-xs text-slate-400 mt-1">From reminder to payment</p>
        </div>
      </div>

      {/* Reminders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="text-sm font-bold text-white">Live Reminder Queue & History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Invoice</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Reminder #</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Sent / Scheduled</th>
                <th className="px-6 py-3.5">Feedback Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No reminder records found.
                  </td>
                </tr>
              ) : (
                reminders.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {r.customer?.name || 'Customer'}
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-400">
                      #{r.invoice?.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      ${r.invoice?.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      #{r.reminderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : r.status === 'CANCELLED'
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : r.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {r.sentAt ? new Date(r.sentAt).toLocaleDateString() : 'Scheduled'}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-300">
                      {r.status === 'PAID' ? (
                        <span className="text-emerald-400 font-semibold">Payment Confirmed in PayPal</span>
                      ) : r.status === 'CANCELLED' ? (
                        <span className="text-slate-400">Auto-cancelled (Settled)</span>
                      ) : (
                        <span className="text-slate-400">Awaiting Settlement</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Configuration Modal */}
      <Modal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        title="Merchant Reminder Policy & Dunning Thresholds"
        subtitle="Configure automated cadence and human-in-the-loop review requirements"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">1st Reminder</label>
              <input
                type="number"
                value={policyForm.firstReminderDays}
                onChange={(e) => setPolicyForm({ ...policyForm, firstReminderDays: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Days overdue</p>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">2nd Reminder</label>
              <input
                type="number"
                value={policyForm.secondReminderDays}
                onChange={(e) => setPolicyForm({ ...policyForm, secondReminderDays: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Days overdue</p>
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Final Reminder</label>
              <input
                type="number"
                value={policyForm.finalReminderDays}
                onChange={(e) => setPolicyForm({ ...policyForm, finalReminderDays: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Days overdue</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={policyForm.stopOnPayment}
                onChange={(e) => setPolicyForm({ ...policyForm, stopOnPayment: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-200">
                <strong>Stop Reminders Immediately After Payment:</strong> Auto-cancel scheduled reminders once confirmed via PayPal webhook.
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={policyForm.requireApproval}
                onChange={(e) => setPolicyForm({ ...policyForm, requireApproval: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <span className="text-slate-200">
                <strong>Require Merchant Approval:</strong> Stage reminders in Action Center for review before dispatch.
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setPolicyModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 font-bold text-white transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{savingPolicy ? 'Saving...' : 'Save Policy Settings'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
