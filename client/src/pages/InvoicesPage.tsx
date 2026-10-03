import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Receipt,
  Search,
  Send,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useNavigate } from 'react-router-dom';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices || []);
    } catch (e) {
      console.error('Failed to load invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenRemind = (inv: any) => {
    setSelectedInvoice(inv);
    setReminderMessage(
      `Hi ${inv.customer?.name},\n\nJust a friendly reminder that invoice #${inv.invoiceNumber} for $${inv.amount.toFixed(
        2
      )} is currently outstanding.\n\nYou can complete your payment via the secure PayPal link below:\nhttps://www.sandbox.paypal.com/invoice/p/#${
        inv.paypalInvoiceId || inv.invoiceNumber
      }\n\nThank you,\nPayPilot Financial Operations`
    );
    setReminderModalOpen(true);
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice) return;
    setSending(true);
    try {
      await api.post(`/invoices/${selectedInvoice.id}/remind`, {
        messageContent: reminderMessage,
      });
      setReminderModalOpen(false);
      fetchInvoices();
    } catch (e) {
      console.error('Failed to trigger reminder:', e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Loading PayPal Invoice Infrastructure...</span>
        </div>
      </div>
    );
  }

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || inv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              PayPal Invoices & Receivables
            </h1>
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-400 border border-brand-500/30">
              {invoices.length} Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time synchronization with PayPal Invoicing API v2.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice or customer..."
              className="fintech-input pl-10 pr-4 py-2 text-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="fintech-input px-3 py-2 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoice Table / List */}
      <div className="fintech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-fintech-bg/70 border-b border-fintech-border text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reminders Sent</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/80">
              {filtered.map((inv) => {
                const isOverdue = inv.status === 'OVERDUE' || (inv.status === 'UNPAID' && new Date(inv.dueDate) < new Date());
                return (
                  <tr key={inv.id} className="hover:bg-fintech-secondary/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-100">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="p-4">
                      <div
                        onClick={() => navigate(`/customers/${inv.customerId}`)}
                        className="font-semibold text-slate-200 hover:text-brand-400 cursor-pointer"
                      >
                        {inv.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{inv.customer?.email}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-100">
                      ${inv.amount?.toLocaleString()} {inv.currency}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          inv.status === 'PAID'
                            ? 'bg-success-500/10 text-success-400 border-success-500/30'
                            : isOverdue
                            ? 'bg-risk-500/10 text-risk-400 border-risk-500/30'
                            : 'bg-warning-500/10 text-warning-400 border-warning-500/30'
                        }`}
                      >
                        ● {inv.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {inv.reminders?.length || 0}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handleOpenRemind(inv)}
                            className="flex items-center gap-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/30 transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            <span>Remind</span>
                          </button>
                        )}
                        <a
                          href={`https://www.sandbox.paypal.com/invoice/p/#${inv.paypalInvoiceId || inv.invoiceNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-fintech-border text-slate-400 hover:text-slate-200 hover:bg-fintech-secondary transition-colors"
                          title="Open in PayPal Sandbox"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Modal */}
      <Modal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title={`Prepare PayPal Reminder: #${selectedInvoice?.invoiceNumber}`}
        subtitle={`Dispatched to ${selectedInvoice?.customer?.email}`}
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
            disabled={sending}
            className="fintech-btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            {sending ? 'Dispatching...' : 'Dispatch Reminder via PayPal'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
