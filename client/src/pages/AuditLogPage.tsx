import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ScrollText, Search, ShieldCheck, User, Bot, Zap, Filter } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-log');
      setLogs(res.data.logs || []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Verifying Immutable Compliance Audit Trail...</span>
        </div>
      </div>
    );
  }

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType.toLowerCase().includes(search.toLowerCase()) ||
      l.performedBy.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || l.entityType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Audit Log & Compliance Governance
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
              {logs.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable regulatory audit trail recording all AI reasoning, human approvals, PayPal webhook dispatches, and permission blocks.
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
              placeholder="Search audit actions..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Entity Types</option>
            <option value="ACTION_REQUEST">Action Requests</option>
            <option value="PAYMENT">Payments</option>
            <option value="REMINDER">Reminders</option>
            <option value="PERMISSION">Permission Checks</option>
            <option value="WEBHOOK">Webhooks</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Entity Type</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Performed By</th>
                <th className="px-6 py-3.5">Entity ID</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-400">
                    {log.entityType}
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.performedBy === 'PAYPAL_WEBHOOK'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : log.performedBy === 'USER'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          : log.performedBy === 'PERMISSION_ENGINE'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {log.performedBy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 truncate max-w-xs">
                    {log.entityId}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {log.detailsJson && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 transition-colors"
                      >
                        View JSON
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Payload: ${selectedLog?.action}`}
        subtitle={`Recorded at ${selectedLog ? new Date(selectedLog.timestamp).toISOString() : ''}`}
      >
        <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-96">
          <pre>{selectedLog?.detailsJson ? JSON.stringify(JSON.parse(selectedLog.detailsJson), null, 2) : 'No details'}</pre>
        </div>
      </Modal>
    </div>
  );
};
