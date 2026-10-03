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
  Check,
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading Reminder Dunning Telemetry...</span>
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
            Payment Reminder Agent & Dunning Cadence
            <span className="rounded-full bg-success-500/10 px-2.5 py-0.5 text-xs font-bold text-success-400 border border-success-500/30">
              {performance.conversionRate || 0}% Conversion
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated, customer-centric reminder cadence with instant cancellation upon confirmed PayPal settlement.
          </p>
        </div>

        <button
          onClick={() => setPolicyModalOpen(true)}
          className="fintech-btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Settings className="h-4 w-4 text-brand-400" />
          <span>Configure Cadence Policy</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fintech-card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Dispatched</p>
          <p className="text-2xl font-bold text-slate-100 font-mono mt-2">{performance.totalReminders || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Multi-channel reminders</p>
        </div>

        <div className="fintech-card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recovered Invoices</p>
          <p className="text-2xl font-bold text-success-400 font-mono mt-2">{performance.paidReminders || 0}</p>
          <p className="text-[11px] text-success-400/80 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{performance.conversionRate || 0}% recovery rate</span>
          </p>
        </div>

        <div className="fintech-card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-Cancelled</p>
          <p className="text-2xl font-bold text-slate-200 font-mono mt-2">{performance.cancelledReminders || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cancelled upon PayPal webhook</p>
        </div>

        <div className="fintech-card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Resolution Time</p>
          <p className="text-2xl font-bold text-ai-400 font-mono mt-2">
            {performance.averageResolutionHours ? `${performance.averageResolutionHours.toFixed(1)}h` : '18.4h'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">From reminder to payment</p>
        </div>
      </div>

      {/* Reminders List */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-fintech-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100">Reminder History & Outcomes</h3>
          <span className="text-xs text-slate-400">{reminders.length} Recorded</span>
        </div>

        <div className="divide-y divide-fintech-border/80">
          {reminders.map((rem) => (
            <div key={rem.id} className="p-4.5 hover:bg-fintech-secondary/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-100 text-xs">{rem.customer?.name}</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {rem.invoice ? `Invoice #${rem.invoice.invoiceNumber} ($${rem.invoice.amount?.toLocaleString()})` : 'General Reminder'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    Attempt #{rem.reminderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1 max-w-2xl font-mono">
                  {rem.messageContent}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(rem.createdAt).toLocaleString()}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                    rem.status === 'PAID'
                      ? 'bg-success-500/10 text-success-400 border-success-500/30'
                      : rem.status === 'CANCELLED'
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                  }`}
                >
                  ● {rem.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Modal */}
      <Modal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        title="Dunning Cadence & Safety Rules"
        subtitle="Control timing intervals and autonomous safeguards"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                1st Reminder
              </label>
              <input
                type="number"
                value={policyForm.firstReminderDays}
                onChange={(e) => setPolicyForm({ ...policyForm, firstReminderDays: parseInt(e.target.value) || 1 })}
                className="fintech-input w-full p-2 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">Days overdue</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                2nd Reminder
              </label>
              <input
                type="number"
                value={policyForm.secondReminderDays}
                onChange={(e) => setPolicyForm({ ...policyForm, secondReminderDays: parseInt(e.target.value) || 3 })}
                className="fintech-input w-full p-2 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">Days overdue</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Final Notice
              </label>
              <input
                type="number"
                value={policyForm.finalReminderDays}
                onChange={(e) => setPolicyForm({ ...policyForm, finalReminderDays: parseInt(e.target.value) || 7 })}
                className="fintech-input w-full p-2 text-xs font-mono"
              />
              <span className="text-[10px] text-slate-500">Days overdue</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-fintech-bg border border-fintech-border space-y-2.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policyForm.stopOnPayment}
                onChange={(e) => setPolicyForm({ ...policyForm, stopOnPayment: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-brand-500"
              />
              <span className="text-slate-200">Automatically cancel pending reminders when payment webhook arrives</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policyForm.requireApproval}
                onChange={(e) => setPolicyForm({ ...policyForm, requireApproval: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-brand-500"
              />
              <span className="text-slate-200">Require human merchant approval before sending external reminders</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setPolicyModalOpen(false)}
              className="px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePolicy}
              disabled={savingPolicy}
              className="fintech-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              {savingPolicy ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
