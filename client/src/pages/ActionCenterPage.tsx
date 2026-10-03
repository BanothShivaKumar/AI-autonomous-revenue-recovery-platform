import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PermissionTierBadge } from '../components/common/Badges';
import { Modal } from '../components/common/Modal';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
  FileEdit,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const ActionCenterPage: React.FC = () => {
  const { refreshGlobal } = useOutletContext<{ refreshGlobal: () => void }>() || {};
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORIC'>('PENDING');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      const res = await api.get('/action-center');
      setActions(res.data.actions || []);
    } catch (e) {
      console.error('Failed to load action center:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleApprove = async (action: any, customPayload?: any) => {
    setProcessingId(action.id);
    try {
      await api.post(`/action-center/${action.id}/approve`, {
        customPayload,
      });
      await fetchActions();
      if (refreshGlobal) refreshGlobal();
      setEditModalOpen(false);
    } catch (e: any) {
      alert(`Approval error: ${e.response?.data?.error || e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (action: any) => {
    const reason = prompt('Please enter a rejection reason:');
    if (reason === null) return;
    setProcessingId(action.id);
    try {
      await api.post(`/action-center/${action.id}/reject`, {
        rejectionReason: reason || 'Rejected by merchant administrator',
      });
      await fetchActions();
      if (refreshGlobal) refreshGlobal();
    } catch (e: any) {
      alert(`Rejection error: ${e.response?.data?.error || e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenEdit = (action: any) => {
    setSelectedAction(action);
    const payload = JSON.parse(action.proposedPayloadJson || '{}');
    setEditedMessage(payload.messageContent || '');
    setEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span>Verifying Permission Engine Staged Actions...</span>
        </div>
      </div>
    );
  }

  const pendingActions = actions.filter((a) => a.status === 'PENDING_APPROVAL');
  const historicActions = actions.filter((a) => a.status !== 'PENDING_APPROVAL');
  const displayList = activeTab === 'PENDING' ? pendingActions : historicActions;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            Permission & Action Approval Center
            {pendingActions.length > 0 && (
              <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
                {pendingActions.length} Actions Awaiting Review
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-loop permission gateway. AI models can propose recovery actions, but never execute unauthorized operations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Review ({pendingActions.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORIC')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'HISTORIC'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Action History ({historicActions.length})
          </button>
        </div>
      </div>

      {/* Action Cards List */}
      {displayList.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">Action Center Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'All AI-proposed recovery actions have been reviewed. New actions will appear here when generated by the Recovery Agent.'
              : 'No historical executed actions found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((action) => {
            const payload = JSON.parse(action.proposedPayloadJson || '{}');
            const isPending = action.status === 'PENDING_APPROVAL';

            return (
              <div
                key={action.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          Action: {action.actionType.replace(/_/g, ' ')}
                        </h3>
                        <PermissionTierBadge tier={action.permissionTier} />
                      </div>
                      <p className="text-xs text-slate-400">
                        Target Account: <strong className="text-slate-200">{action.customer?.name || 'Customer'}</strong>
                        {action.invoice && ` • Invoice #${action.invoice.invoiceNumber} ($${action.invoice.amount?.toLocaleString()})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        action.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : action.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : action.status === 'CANCELLED'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {action.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Reasoning & Behavioral Context</p>
                    <p className="text-slate-200 leading-relaxed">{action.reasoning}</p>
                    {action.riskAnalysis && (
                      <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                        Risk Analysis: {action.riskAnalysis}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staged Payload Preview</p>
                    {payload.messageContent ? (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {payload.messageContent}
                      </div>
                    ) : (
                      <pre className="p-2 rounded bg-slate-900 text-[10px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(payload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                {isPending && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleOpenEdit(action)}
                      disabled={processingId === action.id}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition-colors"
                    >
                      <FileEdit className="h-4 w-4" />
                      <span>Edit Content</span>
                    </button>

                    <button
                      onClick={() => handleReject(action)}
                      disabled={processingId === action.id}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/50 px-4 py-2 text-xs font-bold text-rose-300 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(action)}
                      disabled={processingId === action.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      {processingId === action.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Authorizing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve & Authorize</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Content Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit & Authorize Recovery Action"
        subtitle="Modify message tone or parameters prior to PayPal execution"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Message Content
            </label>
            <textarea
              rows={8}
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white focus:border-blue-500 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const payload = JSON.parse(selectedAction.proposedPayloadJson || '{}');
                payload.messageContent = editedMessage;
                handleApprove(selectedAction, payload);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Save & Authorize Execution</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
