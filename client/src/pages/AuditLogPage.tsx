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
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>Verifying Immutable Compliance Audit Trail...</span>
        </div>
      </div>
    );
  }

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
      l.performedBy?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || l.entityType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            Audit Log & Compliance Governance
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-400 border border-brand-500/30">
              {logs.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable regulatory audit trail recording all AI reasoning, human approvals, PayPal webhook dispatches, and permission evaluations.
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
              placeholder="Search audit trail..."
              className="fintech-input pl-10 pr-4 py-2 text-xs"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="fintech-input px-3 py-2 text-xs"
          >
            <option value="ALL">All Entity Types</option>
            <option value="ACTION">Action Center</option>
            <option value="INVOICE">Invoices</option>
            <option value="REMINDER">Reminders</option>
            <option value="WEBHOOK">Webhooks</option>
            <option value="AGENT">AI Agent</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="fintech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-fintech-bg/70 border-b border-fintech-border text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Payload / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border/80">
              {filtered.map((log) => {
                const isAI = log.performedBy?.includes('AI') || log.performedBy?.includes('agent');
                const isWebhook = log.performedBy?.includes('webhook') || log.entityType === 'WEBHOOK';

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-fintech-secondary/40 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-fintech-bg border border-fintech-border text-slate-300">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-100">
                      {log.action}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          isAI
                            ? 'text-ai-400 bg-ai-500/10 border border-ai-500/20'
                            : isWebhook
                            ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
                            : 'text-success-400 bg-success-500/10 border border-success-500/20'
                        }`}
                      >
                        {isAI ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        <span>{log.performedBy}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {log.metadataJson ? log.metadataJson : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event: ${selectedLog?.action || ''}`}
        subtitle={`Recorded at ${selectedLog ? new Date(selectedLog.createdAt).toLocaleString() : ''}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-fintech-bg border border-fintech-border">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Actor:</span>
              <p className="font-semibold text-slate-100 mt-0.5">{selectedLog?.performedBy}</p>
            </div>
            <div className="p-3 rounded-lg bg-fintech-bg border border-fintech-border">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Entity Type:</span>
              <p className="font-mono text-brand-400 mt-0.5">{selectedLog?.entityType} ({selectedLog?.entityId})</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-fintech-bg border border-fintech-border space-y-1">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Full Metadata JSON</span>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 whitespace-pre-wrap">
              {selectedLog?.metadataJson ? JSON.stringify(JSON.parse(selectedLog.metadataJson), null, 2) : 'No metadata recorded'}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};
