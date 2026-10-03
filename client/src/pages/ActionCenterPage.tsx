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
  ShieldCheck,
  Lock,
  Check,
  Info,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const ActionCenterPage: React.FC = () => {
  const { refreshGlobal } = useOutletContext<{ refreshGlobal: () => void }>() || {};
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORIC'>('PENDING');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [permissionInfoModalOpen, setPermissionInfoModalOpen] = useState(false);
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
        <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="font-semibold text-slate-300">Evaluating Permission Engine Actions...</span>
        </div>
      </div>
    );
  }

  const pendingActions = actions.filter((a) => a.status === 'PENDING_APPROVAL');
  const historicActions = actions.filter((a) => a.status !== 'PENDING_APPROVAL');
  const displayList = activeTab === 'PENDING' ? pendingActions : historicActions;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Action & Permission Center
            </h1>
            {pendingActions.length > 0 && (
              <span className="rounded-full bg-warning-500/10 px-2.5 py-0.5 text-xs font-bold text-warning-400 border border-warning-500/30">
                {pendingActions.length} Requires Approval
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-loop permission gateway. AI assists with intelligence, while humans explicitly authorize financial and customer communication decisions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl border border-fintech-border bg-fintech-bg p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Review ({pendingActions.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORIC')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'HISTORIC'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Action History ({historicActions.length})
          </button>
        </div>
      </div>

      {/* Security & Permission Engine Visible Ribbon */}
      <div className="fintech-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI PERMISSION ENGINE</p>
            <p className="text-[11px] text-slate-400">Deterministic security tiers active on PayPal Sandbox integration</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-fintech-bg border border-fintech-border text-[11px] font-mono text-success-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> READ
          </span>
          <span className="px-2.5 py-1 rounded-md bg-fintech-bg border border-fintech-border text-[11px] font-mono text-success-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> COMMUNICATION
          </span>
          <span className="px-2.5 py-1 rounded-md bg-fintech-bg border border-fintech-border text-[11px] font-mono text-success-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> LOW RISK
          </span>
          <button
            onClick={() => setPermissionInfoModalOpen(true)}
            className="px-2.5 py-1 rounded-md bg-fintech-bg hover:bg-fintech-secondary border border-warning-500/40 text-[11px] font-mono text-warning-400 flex items-center gap-1 transition-colors"
            title="Click to view financial security rule"
          >
            <Lock className="h-3 w-3" /> FINANCIAL
          </button>
        </div>
      </div>

      {/* Action Cards List */}
      {displayList.length === 0 ? (
        <div className="fintech-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-success-500/10 border border-success-500/20 text-success-400">
            <CheckCircle2 className="h-6 w-6 text-success-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-100">Action Center Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {activeTab === 'PENDING'
              ? 'All AI-proposed recovery actions have been reviewed and resolved. When the Recovery Agent identifies new opportunities, staged actions will appear here for authorization.'
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
                className="fintech-card p-6 space-y-4 hover:border-brand-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-fintech-border">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ai-500/10 text-ai-400 border border-ai-500/20 font-bold shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-warning-400 bg-warning-500/10 px-2 py-0.5 rounded border border-warning-500/20">
                          ACTION REQUIRES APPROVAL
                        </span>
                        <h3 className="text-sm font-bold text-slate-100">
                          {action.actionType.replace(/_/g, ' ')}
                        </h3>
                        <PermissionTierBadge tier={action.permissionTier} />
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        <strong className="text-slate-100 font-semibold">{action.customer?.name || 'Customer'}</strong>
                        {action.invoice && (
                          <span className="text-slate-400">
                            {' '}• Invoice #{action.invoice.invoiceNumber} (<span className="font-mono text-slate-200">${action.invoice.amount?.toLocaleString()}</span>)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        action.status === 'APPROVED'
                          ? 'bg-success-500/10 text-success-400 border-success-500/30'
                          : action.status === 'REJECTED'
                          ? 'bg-risk-500/10 text-risk-400 border-risk-500/30'
                          : action.status === 'CANCELLED'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-warning-500/10 text-warning-400 border-warning-500/30'
                      }`}
                    >
                      ● {action.status === 'PENDING_APPROVAL' ? 'Pending Approval' : action.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-fintech-bg border border-fintech-border space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Reason</p>
                    <p className="text-slate-200 leading-relaxed">{action.reasoning}</p>
                    {action.riskAnalysis && (
                      <p className="text-slate-400 text-[11px] pt-2 border-t border-fintech-border">
                        <strong className="text-slate-300">Risk Assessment:</strong> {action.riskAnalysis}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-fintech-bg border border-fintech-border space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ai-400">Staged PayPal Payload Preview</p>
                    {payload.messageContent ? (
                      <div className="p-3 rounded-lg bg-fintech-surface border border-fintech-border font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {payload.messageContent}
                      </div>
                    ) : (
                      <pre className="p-2.5 rounded-lg bg-fintech-surface border border-fintech-border text-[10px] text-slate-300 overflow-x-auto font-mono">
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
                      className="fintech-btn-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>Edit Content</span>
                    </button>

                    <button
                      onClick={() => handleReject(action)}
                      disabled={processingId === action.id}
                      className="px-3.5 py-1.5 rounded-lg border border-risk-500/30 bg-risk-500/10 hover:bg-risk-500/20 text-xs font-semibold text-risk-400 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(action)}
                      disabled={processingId === action.id}
                      className="fintech-btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    >
                      {processingId === action.id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Executing on PayPal Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve Action</span>
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
              className="w-full rounded-xl border border-fintech-border bg-fintech-bg p-3.5 text-xs text-slate-100 focus:border-brand-500 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const payload = JSON.parse(selectedAction.proposedPayloadJson || '{}');
                payload.messageContent = editedMessage;
                handleApprove(selectedAction, payload);
              }}
              className="fintech-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Save & Authorize Execution</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Permission Engine Financial Lock Modal */}
      <Modal
        isOpen={permissionInfoModalOpen}
        onClose={() => setPermissionInfoModalOpen(false)}
        title="Permission Engine: Financial Security Tier"
        subtitle="Explicit merchant authorization safeguard"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/20 text-xs text-warning-300 flex items-start gap-3">
            <Lock className="h-5 w-5 text-warning-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-100">Financial actions require explicit merchant authorization.</p>
              <p className="mt-1 text-slate-300">
                To guarantee financial safety and prevent unintended invoice or payment operations, autonomous AI agents cannot execute monetary refunds, fee waivers, or invoice adjustments without a human administrator reviewing and authorizing the staged payload.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            <strong>Core Principle:</strong> AI assists with intelligent diagnostics and proposal formulation. Humans authorize critical financial decisions.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setPermissionInfoModalOpen(false)}
              className="fintech-btn-secondary px-4 py-2 text-xs font-semibold"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
