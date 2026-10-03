import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { History, Search, ArrowUpRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.transactions || []);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Synchronizing PayPal Transaction Logs...</span>
        </div>
      </div>
    );
  }

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.paypalTransactionId.toLowerCase().includes(search.toLowerCase()) ||
      t.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            PayPal Transactions Telemetry
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              {transactions.length} Captured
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction ledger including successful captures, failed authorizations, and decline diagnostics.
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
              placeholder="Search transaction ID or customer..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">PayPal TXN ID</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Decline / Risk Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-400">
                    {t.paypalTransactionId}
                  </td>
                  <td
                    onClick={() => t.customer && navigate(`/customers/${t.customer.id}`)}
                    className="px-6 py-4 font-semibold text-slate-200 hover:text-blue-400 cursor-pointer"
                  >
                    {t.customer?.name || 'Direct Payer'}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    ${t.amount.toLocaleString()} {t.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {t.paymentMethod}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {new Date(t.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-300">
                    {t.failureReason ? (
                      <span className="text-rose-400 font-semibold">{t.failureReason}</span>
                    ) : (
                      <span className="text-emerald-400">Normal Settlement</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
