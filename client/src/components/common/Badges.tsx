import React from 'react';

export const RiskBadge: React.FC<{ score: number; showText?: boolean }> = ({ score, showText = true }) => {
  let color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let label = 'Low Risk';

  if (score >= 60) {
    color = 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-semibold';
    label = 'Critical Risk';
  } else if (score >= 35) {
    color = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    label = 'Elevated Risk';
  } else if (score >= 15) {
    color = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    label = 'Moderate';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${score >= 60 ? 'bg-rose-400 animate-pulse' : score >= 35 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      <span>{score.toFixed(0)}/100</span>
      {showText && <span className="opacity-75">({label})</span>}
    </span>
  );
};

export const SegmentBadge: React.FC<{ segment: string }> = ({ segment }) => {
  const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    HIGH_VALUE: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30', label: 'High Value' },
    AT_RISK: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', label: 'At Risk' },
    OVERDUE: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', label: 'Overdue' },
    REMINDER_RESPONSIVE: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', label: 'Reminder-Responsive' },
    DECLINING: { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30', label: 'Declining' },
    RELIABLE: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', label: 'Reliable' },
    NEW: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30', label: 'New' },
    INACTIVE: { bg: 'bg-slate-700/40', text: 'text-slate-400', border: 'border-slate-600/30', label: 'Inactive' },
  };

  const current = styles[segment] || styles.RELIABLE;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}>
      {current.label}
    </span>
  );
};

export const PermissionTierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const tiers: Record<string, { bg: string; text: string; border: string; label: string }> = {
    READ: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30', label: 'READ TIER' },
    COMMUNICATION: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30', label: 'COMMUNICATION TIER' },
    LOW_RISK: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', label: 'LOW RISK TIER' },
    FINANCIAL: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', label: 'FINANCIAL TIER (STRICT AUTH)' },
  };

  const current = tiers[tier] || tiers.FINANCIAL;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${current.bg} ${current.text} ${current.border}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {current.label}
    </span>
  );
};
