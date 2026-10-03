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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Synchronizing PayPal Transaction Logs...</span>
        </div>
      </div>
    );
  }

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.paypalTransactionId?.toLowerCase().includes(search.toLowerCase()) ||
      t.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            PayPal Transactions Ledger
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-400 border border-brand-500/30">
              {transactions.length} Captured
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction ledger including successful captures, failed authorizations, and decline diagnostics.
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
              placeholder="Search transaction ID or customer..."
              className="fintech-input pl-10 pr-4 py-2 text-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="fintech-input px-3 py-2 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="fintech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-fintech-bg/70 border-b border-fintech-border text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Decline Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/80">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-fintech-secondary/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-100">
                    {t.paypalTransactionId}
                  </td>
                  <td className="p-4">
                    <span
                      onClick={() => navigate(`/customers/${t.customerId}`)}
                      className="font-semibold text-slate-200 hover:text-brand-400 cursor-pointer"
                    >
                      {t.customer?.name}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-100">
                    ${t.amount?.toLocaleString()} {t.currency}
                  </td>
                  <td className="p-4 font-mono text-slate-300 text-[11px]">
                    {t.type}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        t.status === 'SUCCESS'
                          ? 'bg-success-500/10 text-success-400 border-success-500/30'
                          : t.status === 'FAILED'
                          ? 'bg-risk-500/10 text-risk-400 border-risk-500/30'
                          : 'bg-warning-500/10 text-warning-400 border-warning-500/30'
                      }`}
                    >
                      ● {t.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-400 text-[11px]">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-slate-400 text-[11px]">
                    {t.failureReason ? (
                      <span className="text-risk-400 font-mono">{t.failureReason}</span>
                    ) : (
                      <span className="text-slate-600">—</span>
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
