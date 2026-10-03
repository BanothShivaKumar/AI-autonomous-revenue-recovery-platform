import React from 'react';

export const RiskBadge: React.FC<{ score: number; showText?: boolean }> = ({ score, showText = true }) => {
  let color = 'bg-success-500/10 text-success-500 border-success-500/20';
  let dotColor = 'bg-success-500';
  let label = 'Low Risk';

  if (score >= 60) {
    color = 'bg-risk-500/10 text-risk-500 border-risk-500/20 font-semibold';
    dotColor = 'bg-risk-500';
    label = 'Critical Risk';
  } else if (score >= 35) {
    color = 'bg-warning-500/10 text-warning-500 border-warning-500/20';
    dotColor = 'bg-warning-500';
    label = 'Elevated Risk';
  } else if (score >= 15) {
    color = 'bg-brand-500/10 text-brand-400 border-brand-500/20';
    dotColor = 'bg-brand-400';
    label = 'Moderate';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="font-mono">{score.toFixed(0)}/100</span>
      {showText && <span className="opacity-80">({label})</span>}
    </span>
  );
};

export const SegmentBadge: React.FC<{ segment: string }> = ({ segment }) => {
  const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    HIGH_VALUE: { bg: 'bg-ai-500/10', text: 'text-ai-500', border: 'border-ai-500/20', label: 'High Value' },
    AT_RISK: { bg: 'bg-risk-500/10', text: 'text-risk-500', border: 'border-risk-500/20', label: 'At Risk' },
    OVERDUE: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/20', label: 'Overdue' },
    REMINDER_RESPONSIVE: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20', label: 'Reminder-Responsive' },
    DECLINING: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/20', label: 'Declining' },
    RELIABLE: { bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/20', label: 'Reliable' },
    NEW: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20', label: 'New' },
    INACTIVE: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', label: 'Inactive' },
  };

  const current = styles[segment] || styles.RELIABLE;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}>
      {current.label}
    </span>
  );
};

export const PermissionTierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const tiers: Record<string, { bg: string; text: string; border: string; label: string }> = {
    READ: { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: 'READ' },
    COMMUNICATION: { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20', label: 'COMMUNICATION' },
    LOW_RISK: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/20', label: 'LOW RISK' },
    FINANCIAL: { bg: 'bg-risk-500/10', text: 'text-risk-500', border: 'border-risk-500/20', label: 'FINANCIAL (STRICT AUTH)' },
  };

  const current = tiers[tier] || tiers.FINANCIAL;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${current.bg} ${current.text} ${current.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {current.label}
    </span>
  );
};

