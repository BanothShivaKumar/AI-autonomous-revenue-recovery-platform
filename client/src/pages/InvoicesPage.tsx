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
      }\n\nThank you,\nNova Digital Studio`
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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Loading PayPal Invoice Infrastructure...</span>
        </div>
      </div>
    );
  }

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Invoices & Revenue Recovery
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              {invoices.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            PayPal invoice synchronization, aging intervals, and direct recovery trigger actions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice or customer..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Due Date / Aging</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Reminders</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    #{inv.invoiceNumber}
                  </td>
                  <td
                    onClick={() => navigate(`/customers/${inv.customer?.id}`)}
                    className="px-6 py-4 font-semibold text-slate-200 hover:text-blue-400 cursor-pointer"
                  >
                    {inv.customer?.name || 'Customer'}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    ${inv.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <div>{new Date(inv.dueDate).toLocaleDateString()}</div>
                    {inv.isOverdue && (
                      <span className="text-[10px] font-bold text-rose-400">
                        {inv.daysOverdue} days overdue
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : inv.isOverdue
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {inv.reminders?.length || 0} sent
                  </td>
                  <td className="px-6 py-4 text-right">
                    {inv.status !== 'PAID' && (
                      <button
                        onClick={() => handleOpenRemind(inv)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:text-white border border-blue-500/30 transition-colors"
                      >
                        <Send className="h-3 w-3" />
                        <span>Remind</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Trigger Modal */}
      <Modal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title={`Prepare Reminder: #${selectedInvoice?.invoiceNumber}`}
        subtitle="Generates personalized message and stages in Action Center (Permission Engine)"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Message Content
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
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {sending ? 'Processing...' : 'Prepare & Stage Reminder'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
