import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  trend?: string;
  colorVariant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  isPositive,
  trend,
  colorVariant = 'blue',
  onClick,
}) => {
  const iconThemeMap = {
    blue: 'text-brand-500 bg-brand-500/10 border-brand-500/20',
    cyan: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-success-500 bg-success-500/10 border-success-500/20',
    amber: 'text-warning-500 bg-warning-500/10 border-warning-500/20',
    rose: 'text-risk-500 bg-risk-500/10 border-risk-500/20',
    purple: 'text-ai-500 bg-ai-500/10 border-ai-500/20',
  };

  const iconStyle = iconThemeMap[colorVariant] || iconThemeMap.blue;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[#273449] bg-[#111827] p-5 shadow-card-subtle transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-600 hover:bg-[#151e30]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`rounded-lg p-2 border ${iconStyle}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-white font-mono">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>

      {(change || trend) && (
        <div className="mt-3 pt-3 border-t border-[#273449]/80 flex items-center gap-1.5 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isPositive !== undefined
                  ? isPositive
                    ? 'text-success-500'
                    : 'text-risk-500'
                  : 'text-slate-300'
              }`}
            >
              {isPositive !== undefined && (
                isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />
              )}
              {change}
            </span>
          )}
          {trend && <span className="text-slate-500 text-xs">{trend}</span>}
        </div>
      )}
    </div>
  );
};


